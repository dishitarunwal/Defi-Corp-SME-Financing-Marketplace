// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Simple mock price feed that mimics Chainlink interface
contract MockPriceFeed {
    int256 private price;
    uint8 private _decimals;

    event PriceUpdated(int256 newPrice);

    constructor(int256 initialPrice, uint8 decimals_) {
        price = initialPrice;
        _decimals = decimals_;
    }

    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (0, price, 0, block.timestamp, 0);
    }

    function decimals() external view returns (uint8) {
        return _decimals;
    }

    function updatePrice(int256 newPrice) external {
        price = newPrice;
        emit PriceUpdated(newPrice);
    }
}
