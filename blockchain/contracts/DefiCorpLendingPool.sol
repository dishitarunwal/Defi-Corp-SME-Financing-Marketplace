// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IPriceFeedMock {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    function decimals() external view returns (uint8);
}

/// @title Minimal DefiCorp Lending Pool for testing and integration with MERN
/// @notice This is a simplified, well-commented PoC. Do not use on mainnet without audit.
contract DefiCorpLendingPool is ReentrancyGuard {
    IERC20 public immutable stableToken;
    IPriceFeedMock public priceFeed;          // price = stable units per ETH (scaled by priceFeed.decimals())
    uint256 public constant ETH_DECIMALS = 1e18;

    struct Deposit {
        uint256 principal;    // token units
    }

    struct Borrow {
        uint256 principal;    // borrowed stable token units
        uint256 collateralWei; // ETH collateral
        uint256 lastAccrualBlock;
    }

    mapping(address => Deposit) public deposits;
    mapping(address => Borrow) public borrows;

    uint256 public borrowLTVPercent = 50;     // default 50% LTV
    uint256 public liquidationThresholdPercent = 65; // when health < this, liquidatable
    uint256 public liquidationPenaltyPercent = 5;    // 5% extra collateral to liquidator

    event DepositMade(address indexed user, uint256 amount);
    event WithdrawMade(address indexed user, uint256 amount);
    event BorrowTaken(address indexed borrower, uint256 amount, uint256 collateralWei);
    event RepaymentMade(address indexed borrower, uint256 amount);
    event CollateralWithdrawn(address indexed borrower, uint256 collateralWei);
    event Liquidation(address indexed liquidator, address indexed borrower, uint256 repaidAmount, uint256 collateralSeized);
    event PriceFeedUpdated(address newFeed);

    constructor(address stableTokenAddress, address priceFeedAddress) {
        require(stableTokenAddress != address(0), "stableToken zero");
        require(priceFeedAddress != address(0), "priceFeed zero");
        stableToken = IERC20(stableTokenAddress);
        priceFeed = IPriceFeedMock(priceFeedAddress);
    }

    // -------------------------
    // Utility: price helpers
    // -------------------------
    function _getLatestEthPriceScaledTo1e18() internal view returns (uint256) {
        (, int256 answer, , uint256 updatedAt, ) = priceFeed.latestRoundData();
        require(answer > 0, "invalid price");
        require(updatedAt > block.timestamp - 1 days, "stale price");
        uint8 feedDecimals = priceFeed.decimals();
        if (feedDecimals == 18) {
            return uint256(answer);
        } else if (feedDecimals < 18) {
            return uint256(answer) * (10 ** (18 - feedDecimals));
        } else {
            return uint256(answer) / (10 ** (feedDecimals - 18));
        }
    }

    // collateral value in stable token units (token decimals assumed same base)
    function getCollateralValueInStable(address user) public view returns (uint256) {
        Borrow storage b = borrows[user];
        if (b.collateralWei == 0) return 0;
        uint256 price = _getLatestEthPriceScaledTo1e18();
        return (b.collateralWei * price) / ETH_DECIMALS;
    }

    function getCurrentBorrowWithInterest(address user) public view returns (uint256) {
        Borrow storage b = borrows[user];
        // interest omitted in PoC; returns principal directly
        return b.principal;
    }

    function getHealthFactorPercent(address user) external view returns (uint256) {
        uint256 debt = getCurrentBorrowWithInterest(user);
        if (debt == 0) return type(uint256).max;
        uint256 collateralValue = getCollateralValueInStable(user);
        return (collateralValue * 100) / debt;
    }

    // -------------------------
    // Deposit / Withdraw
    // -------------------------
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "zero deposit");
        bool ok = stableToken.transferFrom(msg.sender, address(this), amount);
        require(ok, "transferFrom failed");
        deposits[msg.sender].principal += amount;
        emit DepositMade(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "zero withdraw");
        Deposit storage d = deposits[msg.sender];
        require(amount <= d.principal, "insufficient principal");
        d.principal -= amount;
        bool ok = stableToken.transfer(msg.sender, amount);
        require(ok, "transfer failed");
        emit WithdrawMade(msg.sender, amount);
    }

    // -------------------------
    // Borrowing / repay / collateral
    // -------------------------
    function borrow(uint256 amount) external payable nonReentrant {
        require(amount > 0, "zero borrow");
        require(msg.value > 0, "need ETH collateral");

        Borrow storage b = borrows[msg.sender];

        uint256 newCollateral = b.collateralWei + msg.value;
        uint256 price = _getLatestEthPriceScaledTo1e18();
        uint256 totalCollateralValue = (newCollateral * price) / ETH_DECIMALS;
        uint256 maxBorrow = (totalCollateralValue * borrowLTVPercent) / 100;

        uint256 newBorrow = b.principal + amount;
        require(newBorrow <= maxBorrow, "exceeds LTV");
        require(stableToken.balanceOf(address(this)) >= amount, "insufficient pool liquidity");

        b.principal = newBorrow;
        b.collateralWei = newCollateral;
        b.lastAccrualBlock = block.number;

        bool ok = stableToken.transfer(msg.sender, amount);
        require(ok, "transfer failed");

        emit BorrowTaken(msg.sender, amount, msg.value);
    }

    function repay(uint256 amount) external nonReentrant {
        require(amount > 0, "zero repay");
        Borrow storage b = borrows[msg.sender];
        require(b.principal > 0, "no debt");

        uint256 repayAmount = amount;
        if (repayAmount > b.principal) repayAmount = b.principal;

        bool ok = stableToken.transferFrom(msg.sender, address(this), repayAmount);
        require(ok, "transferFrom failed");

        b.principal -= repayAmount;
        b.lastAccrualBlock = block.number;

        emit RepaymentMade(msg.sender, repayAmount);
    }

    function withdrawCollateral() external nonReentrant {
        Borrow storage b = borrows[msg.sender];
        require(b.principal == 0, "outstanding debt");
        uint256 collateral = b.collateralWei;
        require(collateral > 0, "no collateral");
        b.collateralWei = 0;
        (bool sent, ) = msg.sender.call{value: collateral}("");
        require(sent, "ETH send failed");
        emit CollateralWithdrawn(msg.sender, collateral);
    }

    // -------------------------
    // Liquidation (anyone can call)
    // -------------------------
    function liquidate(address borrower, uint256 repayAmount) external nonReentrant {
        require(repayAmount > 0, "zero repay");
        Borrow storage b = borrows[borrower];
        require(b.principal > 0, "no debt");

        uint256 health = (getCollateralValueInStable(borrower) * 100) / getCurrentBorrowWithInterest(borrower);
        require(health < liquidationThresholdPercent, "position not liquidatable");

        uint256 actualRepay = repayAmount;
        if (actualRepay > b.principal) actualRepay = b.principal;

        bool ok = stableToken.transferFrom(msg.sender, address(this), actualRepay);
        require(ok, "transferFrom failed");

        uint256 price = _getLatestEthPriceScaledTo1e18();
        uint256 numerator = actualRepay * (100 + liquidationPenaltyPercent) * ETH_DECIMALS;
        uint256 collateralToSeize = numerator / (price * 100);
        if (collateralToSeize > b.collateralWei) collateralToSeize = b.collateralWei;

        b.principal -= actualRepay;
        b.collateralWei -= collateralToSeize;

        (bool sent, ) = msg.sender.call{value: collateralToSeize}("");
        require(sent, "ETH send to liquidator failed");

        emit Liquidation(msg.sender, borrower, actualRepay, collateralToSeize);
    }

    // -------------------------
    // Admin helpers (simple)
    // -------------------------
    function setPriceFeed(address newFeed) external {
        require(newFeed != address(0), "zero");
        priceFeed = IPriceFeedMock(newFeed);
        emit PriceFeedUpdated(newFeed);
    }

    // receive ETH fallback
    receive() external payable {}
}
