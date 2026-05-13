/**
 * Lead Classification Utility for Ejad Plus
 * Classifies leads as 'qualified' or 'irrelevant' based on nature of business input
 */

// Whitelist keywords - if ANY match, lead is ALWAYS qualified
const WHITELIST_PATTERNS = [
  // Core Ecommerce & Online Business
  'ecommerce', 'e-commerce', 'e commerce', 'ecom', 'ecomerce', 'ecommers',
  'online business', 'online store', 'commerce store',
  'amazon', 'amazon fba', 'amazon affiliate', 'seller central',
  'ebay', 'dropshipping', 'drop shipping', 'marketplace seller',
  'shopify', 'woocommerce',
  
  // Payments & US Setup
  'llc', 'company formation', 'register company',
  'us company', 'usa company',
  'ein', 'tax id',
  'us bank account', 'business bank account',
  'stripe', 'paypal', 'wise', 'payoneer',
  'receiving international payments', 'merchant account', 'payout services',
  'virtual card', 'payment gateway',
  
  // Software, IT & SaaS
  'software', 'software development', 'software house', 'software company',
  'saas', 'ai automation', 'ai calling agency',
  'it services', 'it solutions', 'it consulting', 'cloud consultancy',
  'application development', 'web development', 'website design',
  'software engineer', 'developer', 'tech services',
  
  // Digital & Service Businesses
  'digital marketing', 'marketing agency', 'seo services',
  'branding', 'content marketing', 'email marketing',
  'graphic design', 'video editing', 'design agency',
  'virtual assistant', 'bpo', 'call center', 'customer support',
  'outsourcing agency', 'service provider',
  
  // Freelancers & Agencies
  'freelancer', 'freelancing', 'free lance',
  'consulting', 'consultancy', 'service based',
  'marketing consultant', 'business consultant',
  'training', 'education and consultancy',
  
  // Trading, Logistics & Export
  'import export', 'export import', 'trading company',
  'logistics', 'dispatch', 'truck dispatch', 'trucking',
  'shipping', 'freight forwarding',
  'general trade', 'wholesale',
  
  // Medical & Professional Services
  'medical billing', 'rcm', 'healthcare it',
  'insurance broker', 'accountancy services',
  'cfo services', 'financial services',
  'doctor',
  
  // Manufacturing & Brands
  'textile', 'apparel manufacturer', 'clothing manufacturer',
  'leather manufacturing', 'surgical instruments',
  'electronics import', 'appliances'
];

// Blacklist patterns for job/student/employment seeking
const JOB_STUDENT_PATTERNS = [
  'job', 'jobs', 'looking for job', 'job bidding',
  'govt job', 'private job', 'salaried person',
  'office boy', 'rider', 'driver', 'helper',
  'student', 'study', 'schooling', 'college', 'school', 'fsc',
  'intern', 'internship', 'fresher',
  'unemployed', 'jobless', 'no work',
  'personal use', 'personal account', 'self usage',
  'i need a job', 'free job'
];

// Noise/non-business patterns - these need exact word matching
const NOISE_PATTERNS = [
  'foryoupage', 'fyp'
];

// Exact match noise patterns (single word responses)
const EXACT_NOISE_PATTERNS = [
  'yes', 'no', 'ok', 'good', 'hmm', 'normal', 'please',
  'hi', 'hello', 'love you', 'god bless'
];

/**
 * Normalizes input text for classification
 * - Converts to lowercase
 * - Trims leading and trailing spaces
 * - Replaces multiple spaces with single space
 * - Removes special characters except letters, numbers, and spaces
 */
export function normalizeInput(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '');
}

/**
 * Checks if input contains any pattern from the given list
 */
function containsAny(normalizedInput: string, patterns: string[]): boolean {
  return patterns.some(pattern => normalizedInput.includes(pattern));
}

/**
 * Checks if input contains any pattern from the given list using word boundary matching
 */
function containsAnyWord(normalizedInput: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    // For multi-word patterns, use contains
    if (pattern.includes(' ')) {
      return normalizedInput.includes(pattern);
    }
    // For single-word patterns, use word boundary matching
    const regex = new RegExp(`\\b${pattern}\\b`, 'i');
    return regex.test(normalizedInput);
  });
}

/**
 * Checks if input is mostly numbers or contains invalid sequences
 */
function isInvalidData(normalizedInput: string): boolean {
  // Check length
  if (normalizedInput.length < 3) return true;
  
  // Check if only numbers or mostly numbers (>70% digits)
  const digitCount = (normalizedInput.match(/\d/g) || []).length;
  const letterCount = (normalizedInput.match(/[a-z]/g) || []).length;
  if (letterCount === 0 && digitCount > 0) return true;
  if (digitCount > 0 && digitCount / normalizedInput.replace(/\s/g, '').length > 0.7) return true;
  
  // Check for number sequences
  if (/1234|12345|786/.test(normalizedInput)) return true;
  
  return false;
}

/**
 * Checks if input looks like gibberish (random letters without real words)
 */
function isGibberish(normalizedInput: string): boolean {
  // If very short (less than 6 chars) and no whitelist match, likely gibberish
  if (normalizedInput.length < 6) return true;
  
  // Check for common English word patterns - must have at least one vowel
  const hasVowel = /[aeiou]/i.test(normalizedInput);
  if (!hasVowel) return true;
  
  // Check consonant clusters (more than 4 consonants in a row is unusual)
  if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(normalizedInput)) return true;
  
  // Check for repetitive patterns (same letter 3+ times)
  if (/(.)\1{2,}/.test(normalizedInput)) return true;
  
  // Check vowel to consonant ratio - gibberish often has weird ratios
  const vowelCount = (normalizedInput.match(/[aeiou]/gi) || []).length;
  const consonantCount = (normalizedInput.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;
  const totalLetters = vowelCount + consonantCount;
  
  // Normal English has ~40% vowels, flag if less than 20% or more than 60%
  if (totalLetters > 0) {
    const vowelRatio = vowelCount / totalLetters;
    if (vowelRatio < 0.15 || vowelRatio > 0.7) return true;
  }
  
  return false;
}

/**
 * Checks if input contains scientific notation patterns
 */
function hasScientificNotation(input: string): boolean {
  return /e\+\d{2,}/.test(input.toLowerCase());
}

/**
 * Checks if input contains URLs
 */
function hasUrls(input: string): boolean {
  return /https?:\/\/|www\./i.test(input);
}

/**
 * Checks if input contains emojis
 */
function hasEmojis(input: string): boolean {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  return emojiRegex.test(input);
}

/**
 * Checks if input contains hashtags
 */
function hasHashtags(input: string): boolean {
  return /#\w+/.test(input);
}

export type LeadStatus = 'qualified' | 'irrelevant';

export interface ClassificationResult {
  status: LeadStatus;
  reason?: string;
}

/**
 * Classifies a lead based on nature of business input
 * Returns 'qualified' or 'irrelevant' status
 */
export function classifyLead(natureOfBusiness: string): ClassificationResult {
  const originalInput = natureOfBusiness;
  const normalizedInput = normalizeInput(natureOfBusiness);
  
  // STEP 1: Check whitelist first - if match, always qualified
  if (containsAny(normalizedInput, WHITELIST_PATTERNS)) {
    return { status: 'qualified', reason: 'Matched whitelist pattern' };
  }
  
  // STEP 2: Apply blacklist checks (only if whitelist didn't match)
  
  // Check for emojis
  if (hasEmojis(originalInput)) {
    return { status: 'irrelevant', reason: 'Contains emojis' };
  }
  
  // Check for hashtags
  if (hasHashtags(originalInput)) {
    return { status: 'irrelevant', reason: 'Contains hashtags' };
  }
  
  // Check for URLs
  if (hasUrls(originalInput)) {
    return { status: 'irrelevant', reason: 'Contains URLs' };
  }
  
  // Check for scientific notation
  if (hasScientificNotation(originalInput)) {
    return { status: 'irrelevant', reason: 'Contains scientific notation' };
  }
  
  // Check for invalid data (too short, mostly numbers, sequences)
  if (isInvalidData(normalizedInput)) {
    return { status: 'irrelevant', reason: 'Invalid or fake data' };
  }
  
  // Check for gibberish (random letters that don't form real words)
  if (isGibberish(normalizedInput)) {
    return { status: 'irrelevant', reason: 'Gibberish or random text' };
  }
  
  // Check for job/student patterns using word boundary matching
  if (containsAnyWord(normalizedInput, JOB_STUDENT_PATTERNS)) {
    return { status: 'irrelevant', reason: 'Job/student seeking' };
  }
  
  // Check for noise patterns (contains match)
  if (containsAny(normalizedInput, NOISE_PATTERNS)) {
    return { status: 'irrelevant', reason: 'Non-business response' };
  }
  
  // Check for exact noise patterns (exact match only for short responses)
  if (EXACT_NOISE_PATTERNS.includes(normalizedInput)) {
    return { status: 'irrelevant', reason: 'Non-business response' };
  }
  
  // DEFAULT: If no whitelist matched, mark as IRRELEVANT
  // Only whitelisted business types should be qualified
  return { status: 'irrelevant', reason: 'No whitelist match - unrecognized business type' };
}
