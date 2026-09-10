// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// Minimal fixtures: these are deliberately not production implementations.
contract Counter {
    uint256 public value;
    bool private initialized;

    function initialize(uint256 initialValue) external {
        require(!initialized, "already initialized");
        require(initialValue > 0, "invalid initial value");
        initialized = true;
        value = initialValue;
    }
}

contract CounterV2 is Counter {
    uint256 public extra;

    function setExtra(uint256 nextExtra) external {
        require(nextExtra > 0, "invalid extra");
        extra = nextExtra;
    }
}

contract IncompatibleCounter {
    address public value;
    bool private initialized;
}

library TestLibrary {
    function add(uint256 a, uint256 b) external pure returns (uint256) {
        return a + b;
    }
}

contract VerifyTarget {
    uint256 public immutable value;

    constructor(uint256 initialValue) {
        value = TestLibrary.add(initialValue, 1);
    }
}
