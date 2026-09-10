import { BigNumber } from "ethers";
export interface HardhatNumberHelpers {
    to1e18(n: any): BigNumber;
    to1ePrecision(n: any, precision: number): BigNumber;
    from1e18(n: any): string;
    from1ePrecision(n: any, precision: number): string;
}
export declare function to1e18(n: any): BigNumber;
export declare function to1ePrecision(n: any, precision: number): BigNumber;
export declare function from1e18(n: any): string;
export declare function from1ePrecision(n: any, precision: number): string;
//# sourceMappingURL=number.d.ts.map