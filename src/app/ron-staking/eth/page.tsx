"use client";
import { useState, useEffect, useRef } from "react";
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
import stakRewardAbi from "./abi/stakRewardAbi.json";
import stakTokenAbi from "./abi/stakTokenAbi.json";
import rewradTokenAbi from "./abi/rewradTokenAbi.json";

const CONTRACT_ADDRESS = "0x99bDFD00D4Ea21D224E2E04b5B13491c6c4f9fA0"; // StakingRewards 质押合约
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
  // 使用 ref 存储合约地址
  const stakingTokenAddressRef = useRef<string>("");
  const rewardTokenAddressRef = useRef<string>("");

  //当前账户
  const [account, setAccount] = useState<string>("");
  //质押合约
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  //质押代币
  const [stakingToken, setStakingToken] = useState<ethers.Contract | null>(
    null
  );
  const [stakingTokenName, setStakingTokenName] = useState<string | null>(null);
  const [stakTokenTotalSupply, setStakTokenTotalSupply] = useState<string>("-");

  //奖励代币
  const [rewardToken, setRewardToken] = useState<ethers.Contract | null>(null);
  const [rewardTokenName, setRewardTokenName] = useState<string | null>(null);
  const [rewardTokenTotalSupply, setRewardTokenTotalSupply] =
    useState<string>("-");
  const [mintAmount, setMintAmount] = useState<string>("");
  const [mintLoading, setMintLoading] = useState<boolean>(false);

  // Duration 相关
  const [duration, setDuration] = useState<string>("");
  const [durationLoading, setDurationLoading] = useState<boolean>(false);

  // 查询余额相关
  const [queryAddress, setQueryAddress] = useState<string>("");
  const [queryBalance, setQueryBalance] = useState<string>("");
  const [queryLoading, setQueryLoading] = useState<boolean>(false);

  // 通知奖励金额相关
  const [notifyAmount, setNotifyAmount] = useState<string>("");
  const [notifyLoading, setNotifyLoading] = useState<boolean>(false);

  // Transfer 相关
  const [transferAddress, setTransferAddress] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [transferLoading, setTransferLoading] = useState<boolean>(false);

  // BalanceOf 相关
  const [balanceAddress, setBalanceAddress] = useState<string>("");
  const [balanceResult, setBalanceResult] = useState<string>("");
  const [balanceLoading, setBalanceLoading] = useState<boolean>(false);

  // Approve 相关
  const [approveAddress, setApproveAddress] = useState<string>("");
  const [approveAmount, setApproveAmount] = useState<string>("");
  const [approveLoading, setApproveLoading] = useState<boolean>(false);

  // Earned 相关
  const [earnedResult, setEarnedResult] = useState<string>("");
  const [earnedLoading, setEarnedLoading] = useState<boolean>(false);

  // GetReward 相关
  const [getRewardLoading, setGetRewardLoading] = useState<boolean>(false);

  //质押合约总供应量
  const [stakTotalSupply, setStakTotalSupply] = useState<string>("-");

  // 状态
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    connectContract();

    // 监听账户切换
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        console.log("00000监听到了么123", accounts);

        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setSuccess(
            `账户已切换到 ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`
          );
          // 重新加载合约数据
          connectContract();
        } else {
          setAccount("");
          setError("请连接钱包");
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);

      // 清理监听器
      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      };
    }
  }, []);

  useEffect(() => {
    if (contract && stakingToken && rewardToken && account) {
      loadContractData();
      const interval = setInterval(loadContractData, 10000); // 每10秒刷新
      return () => clearInterval(interval);
    }
  }, [contract, stakingToken, rewardToken, account]);
  // 连接钱包 链接合约
  const connectContract = async () => {
    try {
      setLoading(true);
      setError("");

      if (!window.ethereum) {
        setError("请安装 MetaMask");
        return;
      }
      const providerSepolia = new ethers.JsonRpcProvider(RPC);
      //钱包签名 参数 是私钥和节点 这里是alchemy sepolia节点
      const wallet = new ethers.Wallet(privateKey, providerSepolia);
      //获取当前账户
      const accounts = await wallet.address;
      //链接质押合约
      const contract = await new ethers.Contract(
        CONTRACT_ADDRESS,
        stakRewardAbi.output.abi,
        wallet
      );
      //从质押合约中获取质押代币地址
      const stakingTokenAddress = await contract.stakingToken();
      stakingTokenAddressRef.current = stakingTokenAddress;

      //获取奖励代币地址
      const rewardTokenAddress = await contract.rewardsToken();
      rewardTokenAddressRef.current = rewardTokenAddress;
      //链接质押代币合约
      const stakingToken = await new ethers.Contract(
        stakingTokenAddress,
        stakTokenAbi.output.abi,
        wallet
      );
      //链接奖励代币合约
      const rewardToken = await new ethers.Contract(
        rewardTokenAddress,
        rewradTokenAbi.output.abi,
        wallet
      );
      setAccount(accounts);
      setContract(contract);
      setStakingToken(stakingToken);
      setRewardToken(rewardToken);
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
      //质押数据
      Promise.all([contract.totalSupply()]).then(([totalSupply]) => {
        setStakTotalSupply(ethers.formatEther(totalSupply));
      });
      //质押代币数据
      Promise.all([stakingToken.name(), stakingToken.totalSupply()]).then(
        ([stakingTokenName, stakingToken]) => {
          setStakingTokenName(stakingTokenName);
          setStakTokenTotalSupply(ethers.formatEther(stakingToken));
        }
      );
      //奖励代币数据
      Promise.all([rewardToken.name(), rewardToken.totalSupply()]).then(
        ([rewardTokenName, totalSupply]) => {
          console.log("奖励代币名称:", rewardTokenName);
          setRewardTokenName(rewardTokenName);
          setRewardTokenTotalSupply(ethers.formatEther(totalSupply));
        }
      );
    } catch (err: any) {
      console.error("加载数据失败:", err);
      setError(err.message);
    }
  };

  const handleTransfer = async () => {
    if (!rewardToken || !mintAmount) return;

    try {
      setMintLoading(true);
      setError("");
      setSuccess("");

      const amount = ethers.parseEther(mintAmount);
      const tx = await rewardToken.transfer(CONTRACT_ADDRESS, amount);
      await tx.wait();

      setSuccess(`成功 mint ${mintAmount} 个代币到 ${CONTRACT_ADDRESS}`);
      setMintAmount("");
      // 刷新余额
      connectContract();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMintLoading(false);
    }
  };

  // 设置奖励持续时间
  const handleDuration = async () => {
    if (!contract || !duration) return;

    try {
      setDurationLoading(true);
      setError("");
      setSuccess("");

      // duration 是秒数，直接传入
      const tx = await contract.setRewardsDuration(duration);
      await tx.wait();

      setSuccess(`成功设置奖励持续时间为 ${duration} 秒`);
      setDuration("");
      // 刷新数据
      connectContract();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDurationLoading(false);
    }
  };

  // 查询奖励代币余额
  const handleQueryBalance = async () => {
    if (!rewardToken || !queryAddress) return;

    try {
      setQueryLoading(true);
      setError("");

      const balance = await rewardToken.balanceOf(queryAddress);
      const formattedBalance = ethers.formatEther(balance);

      setQueryBalance(formattedBalance);
      setSuccess(
        `地址 ${queryAddress.slice(0, 6)}...${queryAddress.slice(
          -4
        )} 的余额为 ${formattedBalance} RWT`
      );
    } catch (err: any) {
      setError(err.message);
      setQueryBalance("");
    } finally {
      setQueryLoading(false);
    }
  };

  // 通知奖励金额
  const handleNotifyReward = async () => {
    if (!contract || !notifyAmount) return;

    try {
      setNotifyLoading(true);
      setError("");
      setSuccess("");

      // 将输入的数量转换为 wei
      const amount = ethers.parseEther(notifyAmount);
      const tx = await contract.notifyRewardAmount(amount);
      await tx.wait();

      setSuccess(`成功通知奖励金额 ${notifyAmount} RWT`);
      setNotifyAmount("");
      // 刷新数据
      connectContract();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setNotifyLoading(false);
    }
  };

  // Transfer 转账
  const handleTransferToken = async () => {
    if (!stakingToken || !transferAddress || !transferAmount) return;

    try {
      setTransferLoading(true);
      setError("");
      setSuccess("");

      const amount = ethers.parseEther(transferAmount);
      const tx = await stakingToken.transfer(transferAddress, amount);
      await tx.wait();

      setSuccess(
        `成功转账 ${transferAmount} STK 到 ${transferAddress.slice(
          0,
          6
        )}...${transferAddress.slice(-4)}`
      );
      setTransferAddress("");
      setTransferAmount("");
      connectContract();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTransferLoading(false);
    }
  };

  // 查询余额
  const handleCheckBalance = async () => {
    if (!stakingToken || !balanceAddress) return;

    try {
      setBalanceLoading(true);
      setError("");

      const balance = await stakingToken.balanceOf(balanceAddress);
      const formattedBalance = ethers.formatEther(balance);

      setBalanceResult(formattedBalance);
      setSuccess(`地址余额: ${formattedBalance} STK`);
    } catch (err: any) {
      setError(err.message);
      setBalanceResult("");
    } finally {
      setBalanceLoading(false);
    }
  };

  // Approve 授权
  const handleApprove = async () => {
    if (!stakingToken || !approveAddress || !approveAmount) return;

    try {
      setApproveLoading(true);
      setError("");
      setSuccess("");

      const amount = ethers.parseEther(approveAmount);
      const tx = await stakingToken.approve(approveAddress, amount);
      await tx.wait();

      setSuccess(
        `成功授权 ${approveAmount} STK 给 ${approveAddress.slice(
          0,
          6
        )}...${approveAddress.slice(-4)}`
      );
      setApproveAddress("");
      setApproveAmount("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApproveLoading(false);
    }
  };

  // 查询已赚取的奖励
  const handleCheckEarned = async () => {
    if (!contract || !account) return;

    try {
      setEarnedLoading(true);
      setError("");

      const earned = await contract.earned(account);
      const formattedEarned = ethers.formatEther(earned);

      setEarnedResult(formattedEarned);
      setSuccess(`当前账户已赚取: ${formattedEarned} RWT`);
    } catch (err: any) {
      setError(err.message);
      setEarnedResult("");
    } finally {
      setEarnedLoading(false);
    }
  };

  // 领取奖励
  const handleGetReward = async () => {
    if (!contract) return;

    try {
      setGetRewardLoading(true);
      setError("");
      setSuccess("");

      const tx = await contract.getReward();
      await tx.wait();

      setSuccess("成功领取奖励！");
      setEarnedResult(""); // 清空已赚取显示
      // 刷新数据
      connectContract();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGetRewardLoading(false);
    }
  };

  // 质押
  const handleStake = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 提取
  const handleWithdraw = async () => {
    if (!contract) return;

    try {
      await loadContractData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

      <>
        <Typography variant="body2" sx={{ mb: 3 }}>
          Account：{account.slice(0, 6)}...{account.slice(-4)}
        </Typography>
        <Grid container spacing={3}>
          {/* 质押合约 */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  StakReward
                </Typography>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ display: "block" }}
                  color="primary"
                >
                  totalSupply:{stakTotalSupply}
                </Typography>

                <TextField
                  label="持续时间(秒)"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  type="number"
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleDuration}
                  disabled={durationLoading || !duration}
                  size="small"
                  sx={{ mb: 2 }}
                >
                  {durationLoading ? "设置中..." : "设置奖励持续时间"}
                </Button>

                <TextField
                  label="奖励金额"
                  value={notifyAmount}
                  onChange={(e) => setNotifyAmount(e.target.value)}
                  type="number"
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleNotifyReward}
                  disabled={notifyLoading || !notifyAmount}
                  size="small"
                  sx={{ mb: 2 }}
                >
                  {notifyLoading ? "通知中..." : "通知奖励金额"}
                </Button>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleCheckEarned}
                  disabled={earnedLoading || !account}
                  size="medium"
                  sx={{ mb: 2 }}
                >
                  {earnedLoading ? "查询中..." : "查询 Earned"}
                </Button>
                {earnedResult && (
                  <Typography
                    variant="h5"
                    sx={{ mt: 2, mb: 2 }}
                    color="success.main"
                  >
                    已赚取: {earnedResult} RWT
                  </Typography>
                )}
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  onClick={handleGetReward}
                  disabled={getRewardLoading}
                  size="small"
                >
                  {getRewardLoading ? "领取中..." : "领取奖励 (getReward)"}
                </Button>
              </CardContent>
            </Card>
          </Grid>
          {/* 质押代币 */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {stakingTokenName}
                </Typography>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ display: "block" }}
                  color="primary"
                >
                  totalSupply:{stakTokenTotalSupply}
                </Typography>

                <TextField
                  label="接收地址"
                  value={transferAddress}
                  onChange={(e) => setTransferAddress(e.target.value)}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <TextField
                  label="数量"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  type="number"
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleTransferToken}
                  disabled={
                    transferLoading || !transferAddress || !transferAmount
                  }
                  size="small"
                  sx={{ mb: 2 }}
                >
                  {transferLoading ? "转账中..." : "转账"}
                </Button>
                <TextField
                  label="查询地址"
                  value={balanceAddress}
                  onChange={(e) => setBalanceAddress(e.target.value)}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleCheckBalance}
                  disabled={balanceLoading || !balanceAddress}
                  size="small"
                  sx={{ mb: 2 }}
                >
                  {balanceLoading ? "查询中..." : "查询余额"}
                </Button>
                {balanceResult && (
                  <Typography variant="body2" color="primary">
                    余额: {balanceResult} STK
                  </Typography>
                )}
                <TextField
                  label="授权地址"
                  value={approveAddress}
                  onChange={(e) => setApproveAddress(e.target.value)}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <TextField
                  label="授权数量"
                  value={approveAmount}
                  onChange={(e) => setApproveAmount(e.target.value)}
                  type="number"
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleApprove}
                  disabled={approveLoading || !approveAddress || !approveAmount}
                  size="small"
                >
                  {approveLoading ? "授权中..." : "授权"}
                </Button>
              </CardContent>
            </Card>
          </Grid>
          {/* 奖励代币 */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {rewardTokenName}
                </Typography>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ display: "block" }}
                >
                  totalSupply:{rewardTokenTotalSupply}
                </Typography>

                <Button
                  variant="contained"
                  onClick={handleTransfer}
                  disabled={mintLoading || !mintAmount}
                  size="small"
                >
                  {mintLoading ? "Transfer..." : "Transfer"}
                </Button>
                <TextField
                  label="数量"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  type="number"
                  size="small"
                  sx={{ ml: 1 }}
                />

                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="查询地址"
                    value={queryAddress}
                    onChange={(e) => setQueryAddress(e.target.value)}
                    type="string"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleQueryBalance}
                    disabled={queryLoading || !queryAddress}
                    size="small"
                  >
                    {queryLoading ? "查询中..." : "查询余额"}
                  </Button>
                  {queryBalance && (
                    <Typography variant="body2" sx={{ mt: 1 }} color="primary">
                      余额: {queryBalance} RWT
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </>
    </Box>
  );
}
