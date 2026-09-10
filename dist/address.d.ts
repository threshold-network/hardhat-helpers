export interface HardhatAddressHelpers {
    validate(address: string): string;
    isValid(address: string): boolean;
    equal(address1: string, address2: string): boolean;
}
/**
 * Validates if an address is valid address supported by ethers. If the provided
 * address is incorrectly formatted it will return the address in correct Checksum
 * Address format.
 *
 * @param {string} address Address to check
 * @return {string} Address as a Checksum Address
 * @throws {HardhatPluginError} Throws an error if address is invalid format of
 * addresses supported by ethers.
 * @throws {HardhatPluginError} Throws an error if address is a zero address.
 */
export declare function validate(address: string): string;
/**
 * Checks if address is valid according to rules specified in the validate
 * function.
 *
 * @param {string} address Address to check
 * @return {boolean} True if address is valid, false otherwise.
 */
export declare function isValid(address: string): boolean;
/**
 * Checks if two addresses are the same.
 *
 * @param {string} address1 Address
 * @param {string} address2 Address
 * @return {boolean} True if addresses match, false otherwise.
 * @throws {HardhatPluginError} If any of the addresses is invalid according
 * to validate function rules.
 */
export declare function equal(address1: string, address2: string): boolean;
//# sourceMappingURL=address.d.ts.map