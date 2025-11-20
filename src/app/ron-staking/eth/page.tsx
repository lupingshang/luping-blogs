"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
} from "@mui/material";
import stakingABI from "./abi.json";

const CONTRACT_ADDRESS = "0x741C3F79361E2611C64Fc3c80b11447e320728A6"; // StakingRewards 质押合约
const RPC = "https://eth-sepolia.g.alchemy.com/v2/J30oQ4CibHuYPK88gOqk6";
const privateKey =
  "a07bfab4d89b46eb66a0de294c4160e4f0acd79ad26deb344f1bb559b570adb5";
// ERC20 ABI
const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 value) public returns (bool)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
];

export default function EthStakingPage() {
  const [account, setAccount] = useState<string>("");
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [stakingToken, setStakingToken] = useState<ethers.Contract | null>(
    null
  );
  const [rewardToken, setRewardToken] = useState<ethers.Contract | null>(null);

  // 合约数据
  const [balance, setBalance] = useState<string>("-");
  const [earned, setEarned] = useState<string>("-");
  const [totalSupply, setTotalSupply] = useState<string>("-");
  const [rewardRate, setRewardRate] = useState<string>("-");
  const [stakingTokenBalance, setStakingTokenBalance] = useState<string>("-");
  const [rewardTokenBalance, setRewardTokenBalance] = useState<string>("-");

  // 输入
  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");

  // 状态
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // 连接钱包
  const connectWallet = async () => {
    try {
      setLoading(true);
      setError("");

      if (!window.ethereum) {
        setError("请安装 MetaMask");
        return;
      }
      //钱包里测试网络地址
      const provider = new ethers.JsonRpcProvider(RPC);

      const wallet = new ethers.Wallet(privateKey, provider);

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        stakingABI.output.abi,
        wallet
      );
      //质押合约读取两个代币合约地址
      const STAKING_TOKEN_ADDRESS = await contract.stakingToken();
      const REWARD_TOKEN_ADDRESS = await contract.rewardsToken();
      //两个 代币合约实例
      const stakingTokenContract = new ethers.Contract(
        STAKING_TOKEN_ADDRESS,
        ERC20_ABI,
        wallet
      );

      const rewardTokenContract = new ethers.Contract(
        REWARD_TOKEN_ADDRESS,
        ERC20_ABI,
        wallet
      );

      const network = await provider.getNetwork();
      console.log("当前网络:", network.name, "Chain ID:", network.chainId);

      setAccount(wallet.address);
      setContract(contract);
      setStakingToken(stakingTokenContract);
      setRewardToken(rewardTokenContract);
      setSuccess(`钱包连接成功 - 网络: ${network.name}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 加载合约数据
  const loadContractData = async () => {
    if (!contract || !stakingToken || !rewardToken || !account) return;
    try {
      const [userBalance, userEarned, supply, rate, stkBalance, rwdBalance] =
        await Promise.all([
          contract.balanceOf(account),
          contract.earned(account),
          contract.totalSupply(),
          contract.rewardRate(),
          stakingToken.balanceOf(account),
          rewardToken.balanceOf(account),
        ]);

      setBalance(ethers.formatEther(userBalance));
      setEarned(ethers.formatEther(userEarned));
      setTotalSupply(ethers.formatEther(supply));
      setRewardRate(ethers.formatEther(rate));
      setStakingTokenBalance(ethers.formatEther(stkBalance));
      setRewardTokenBalance(ethers.formatEther(rwdBalance));
    } catch (err: any) {
      console.error("加载数据失败:", err);
    }
  };

  // 质押
  const handleStake = async () => {
    if (!contract || !stakeAmount) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      console.log(Number(stakeAmount), "----质押数量");

      const tx = await contract.stake(Number(stakeAmount));
      await tx.wait();

      setSuccess("质押成功");
      setStakeAmount("");
      await loadContractData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 提取
  const handleWithdraw = async () => {
    if (!contract || !withdrawAmount) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const amount = ethers.parseEther(withdrawAmount);
      const tx = await contract.withdraw(amount);
      await tx.wait();

      setSuccess("提取成功");
      setWithdrawAmount("");
      await loadContractData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 领取奖励
  const handleGetReward = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const tx = await contract.getReward();
      await tx.wait();

      setSuccess("领取奖励成功");
      await loadContractData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && stakingToken && rewardToken && account) {
      loadContractData();
      const interval = setInterval(loadContractData, 10000); // 每10秒刷新
      return () => clearInterval(interval);
    }
  }, [contract, stakingToken, rewardToken, account]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        ETH Staking
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {!account ? (
        <Button variant="contained" onClick={connectWallet} disabled={loading}>
          {loading ? "连接中..." : "连接钱包"}
        </Button>
      ) : (
        <>
          <Typography variant="body2" sx={{ mb: 3 }}>
            账户: {account.slice(0, 6)}...{account.slice(-4)}
          </Typography>

          <Grid container spacing={3}>
            {/* 第一行：代币余额 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    质押代币余额 (STK)
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {stakingTokenBalance} STK
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    可用于质押的代币数量
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    奖励代币余额 (RWT)
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {rewardTokenBalance} RWT
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    已领取的奖励代币
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* 第二行：信息展示 + 操作 */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    我的质押信息
                  </Typography>
                  <Typography sx={{ mb: 1 }}>已质押: {balance} STK</Typography>
                  <Typography sx={{ mb: 3 }}>
                    待领取奖励: {earned} RWT
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                    质押操作
                  </Typography>
                  <TextField
                    fullWidth
                    label="质押数量"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    type="number"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleStake}
                    disabled={loading || !stakeAmount}
                  >
                    质押
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    池子信息
                  </Typography>
                  <Typography sx={{ mb: 1 }}>
                    总质押量: {totalSupply} STK
                  </Typography>
                  <Typography sx={{ mb: 3 }}>
                    奖励速率: {rewardRate} RWT/秒
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                    领取奖励
                  </Typography>
                  <Typography sx={{ mb: 1 }} color="primary">
                    可领取: {earned} RWT
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleGetReward}
                    disabled={loading || parseFloat(earned) === 0}
                  >
                    领取奖励
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
