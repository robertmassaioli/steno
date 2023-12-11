export function toHexadecimal(inputString: string): string {
  let result = '';

  // Convert each character to its ASCII code and then to hexadecimal
  for (let i = 0; i < inputString.length; i++) {
    const charCode = inputString.charCodeAt(i);
    const hexRepresentation = charCode.toString(16).toUpperCase();

    // Ensure each hexadecimal representation has two characters
    const paddedHex = hexRepresentation.padStart(2, '0');

    // Append the padded hexadecimal representation followed by a space
    result += `${paddedHex} `;
  }

  // Remove the trailing space and return the final result
  return result.trim();
}

export function formatCharacters(inputString: string): string {
  let result = '';

  // Iterate through each character in the input string
  for (let i = 0; i < inputString.length; i++) {
    const char = inputString.charAt(i);
    const charCode = inputString.charCodeAt(i);

    // Check if the character is a newline or a special character
    if (char === '\n' || charCode < 32 || charCode > 126) {
      // Format special characters in \x format
      result += `\\x${charCode.toString(16).toUpperCase()} `;
    } else {
      // Append regular characters followed by a space
      result += `${char} `;
    }
  }

  // Remove the trailing space and return the final result
  return result.trim();
}