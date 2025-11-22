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
  Chip,
  IconButton,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import stakRewardAbi from "./abi/stakRewardAbi.json";
import stakTokenAbi from "./abi/stakTokenAbi.json";
import rewradTokenAbi from "./abi/rewradTokenAbi.json";

const CONTRACT_ADDRESS = "0xE36eD9ADfcdB79aaa117999929E06187ac48E9d3"; // StakingRewards 质押合约
const RPC = "https://eth-sepolia.g.alchemy.com/v2/J30oQ4CibHuYPK88gOqk6";
const privvateKey =
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

  // mint reward相关
  const [rewardMintAddress, setRewardMintAddress] = useState<string>("");
  const [rewardMintAmount, setRewardMintAmount] = useState<string>("");
  const [rewardMintLoading, setRewardMintLoading] = useState<boolean>(false);
  // mint stak相关
  const [stakMitAddress, setStakMitAddress] = useState<string>("");
  const [stakMintAmount, setStakMintAmount] = useState<string>("");
  const [stakMintLoading, setStakMintLoading] = useState<boolean>(false);
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
  const [earnedAdress, setEarnedAdress] = useState<string>("");
  const [earnedLoading, setEarnedLoading] = useState<boolean>(false);

  // GetReward 相关
  const [getRewardLoading, setGetRewardLoading] = useState<boolean>(false);

  // Stake 相关
  const [stakeAmount, setStakeAmount] = useState<string>("");
  const [stakeLoading, setStakeLoading] = useState<boolean>(false);

  //质押合约总供应量
  const [stakTotalSupply, setStakTotalSupply] = useState<string>("-");

  // 状态
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  useEffect(() => {
    window.ethereum.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length > 0) {
        connectContract();
      }
    });
  });
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

      const provider = new ethers.BrowserProvider(window.ethereum);
      // 连接钱包和合约
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        stakRewardAbi.output.abi,
        signer
      );
      console.log("合---》地址", await contract.getAddress());

      const stakingTokenAddress = await contract.stakingToken();
      stakingTokenAddressRef.current = stakingTokenAddress;

      //获取奖励代币地址
      const rewardTokenAddress = await contract.rewardsToken();
      rewardTokenAddressRef.current = rewardTokenAddress;

      //链接质押代币合约
      const stakingToken = new ethers.Contract(
        stakingTokenAddress,
        stakTokenAbi.output.abi,
        signer
      );
      //链接奖励代币合约
      const rewardToken = new ethers.Contract(
        rewardTokenAddress,
        rewradTokenAbi.output.abi,
        signer
      );
      setAccount(accounts[0]);
      setContract(contract);
      setStakingToken(stakingToken);
      setRewardToken(rewardToken);
      // setSuccess("合约连接成功！");
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

  //mint 奖励token
  const handleRewardMintToken = async () => {
    if (!rewardMintAddress || !rewardMintAmount || rewardMintLoading) return;

    try {
      setRewardMintLoading(true);
      setError("");
      setSuccess("");

      const amount = ethers.parseEther(rewardMintAmount);
      const tx = await rewardToken?.mint(rewardMintAddress, amount);
      await tx.wait();

      setSuccess(
        `成功mint ${rewardMintAmount} STK 到 ${rewardMintAddress.slice(
          0,
          6
        )}...${rewardMintAddress.slice(-4)}`
      );
      setRewardMintAddress("");
      setRewardMintAmount("");
      connectContract();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRewardMintLoading(false);
    }
  };
  //mint 质押token
  const handleStakMintToken = async () => {
    console.log(stakMitAddress, stakMintAmount, stakMintLoading);

    if (!stakMitAddress || !stakMintAmount || stakMintLoading) return;
    console.log("质押 mint ");

    try {
      setStakMintLoading(true);
      setError("");
      setSuccess("");
      const amount = ethers.parseEther(stakMintAmount);
      const tx = await stakingToken?.mint(stakMitAddress, amount);
      await tx.wait();

      setSuccess(
        `成功mint ${stakMintAmount} STK 到 ${stakMitAddress.slice(
          0,
          6
        )}...${stakMitAddress.slice(-4)}`
      );
      setStakMitAddress("");
      setStakMintAmount("");
      connectContract();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStakMintLoading(false);
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
    if (!contract || !earnedAdress) return;

    try {
      setEarnedLoading(true);
      setError("");

      const earned = await contract.earned(earnedAdress);
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
    if (!contract || !stakeAmount) return;

    try {
      setStakeLoading(true);
      setError("");
      setSuccess("");

      const amount = ethers.parseEther(stakeAmount);
      const tx = await contract.stake(amount);
      await tx.wait();

      setSuccess(`成功质押 ${stakeAmount} STK`);
      setStakeAmount("");
      // 刷新数据
      connectContract();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStakeLoading(false);
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
  const handleDisconnect = () => {
    // 清空状态
    setAccount("");
    setContract(null);
    setStakingToken(null);
    setRewardToken(null);

    // 提示用户

    // 可选：刷新页面
    // window.location.reload();
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
        {account ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography color="success">
              当前账号为： {account.slice(0, 6)}...{account.slice(-4)}
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                navigator.clipboard.writeText(account);
                setSuccess("地址已复制到剪贴板");
              }}
              title="复制完整地址"
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Button
            variant="contained"
            color="primary"
            sx={{ textTransform: "none", mb: 1 }}
            onClick={connectContract}
            loading={loading}
          >
            connnect Wallet
          </Button>
        )}

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

                <TextField
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
                  color="primary"
                  onClick={handleStake}
                  disabled={stakeLoading || !stakeAmount}
                  size="small"
                  sx={{ mb: 2 }}
                >
                  {stakeLoading ? "质押中..." : "质押 (stake)"}
                </Button>
                <TextField
                  label="查询地址"
                  value={earnedAdress}
                  onChange={(e) => setEarnedAdress(e.target.value)}
                  type="string"
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleCheckEarned}
                  disabled={earnedLoading || !earnedAdress}
                  size="medium"
                  sx={{ mb: 2, textTransform: "none" }}
                >
                  {earnedLoading ? "查询中..." : "查询Earned"}
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
                  value={stakMitAddress}
                  onChange={(e) => setStakMitAddress(e.target.value)}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <TextField
                  label="数量"
                  value={stakMintAmount}
                  onChange={(e) => setStakMintAmount(e.target.value)}
                  type="number"
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleStakMintToken}
                  disabled={
                    stakMintLoading || !stakMitAddress || !stakMintAmount
                  }
                  size="small"
                  sx={{ mb: 2 }}
                >
                  {stakMintLoading ? "Mint..." : "Mint"}
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
                  <Typography sx={{ mb: 2 }} variant="body2" color="primary">
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
                <TextField
                  label="接收地址"
                  value={rewardMintAddress}
                  onChange={(e) => setRewardMintAddress(e.target.value)}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <TextField
                  label="数量"
                  value={rewardMintAmount}
                  onChange={(e) => setRewardMintAmount(e.target.value)}
                  type="number"
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleRewardMintToken}
                  disabled={
                    rewardMintLoading || !rewardMintAddress || !rewardMintAmount
                  }
                  size="small"
                  sx={{ mb: 2 }}
                >
                  {stakMintLoading ? "Mint..." : "Mint"}
                </Button>
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
                    <Typography variant="body2" sx={{ mb: 1 }} color="primary">
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
