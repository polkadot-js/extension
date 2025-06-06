// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

const sanitizeHtml = (input: string, options?: {
  allowLineBreaks?: boolean;
  maxLength?: number;
}): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove all HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Handle line breaks if specified
  if (options?.allowLineBreaks) {
    // Convert <br> to actual line breaks before sanitization
    sanitized = input
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, ''); // Remove other HTML tags
  }

  // Normalize whitespace
  sanitized = sanitized
    .trim()
    .replace(/\s+/g, ' ');

  // Apply length limit if specified
  if (options?.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength) + '...';
  }

  return sanitized;
};

export const sanitizeOrigin = (origin: string): string => {
  return sanitizeHtml(origin, {
    allowLineBreaks: false,
    maxLength: 50
  });
};

// Validate that the origin looks legitimate
export const validateOrigin = (origin: string): boolean => {
  const sanitized = sanitizeOrigin(origin);

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /https?:\/\//i, // URLs in origin name
    /[<>]/, // Remaining HTML characters
    /^\s*$/, // Empty or whitespace only
    /.{50,}/ // Extremely long names
  ];

  return !suspiciousPatterns.some((pattern) => pattern.test(sanitized));
};
