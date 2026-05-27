// src/services/bloodCompatibility.js — Blood type compatibility rules
// These are hard medical rules — never modify without medical guidance

const COMPATIBILITY_MAP = {
  'O-':  ['O-'],
  'O+':  ['O-', 'O+'],
  'A-':  ['O-', 'A-'],
  'A+':  ['O-', 'O+', 'A-', 'A+'],
  'B-':  ['O-', 'B-'],
  'B+':  ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal recipient
};

/**
 * Get list of blood groups that can donate to the given recipient blood group
 * @param {string} recipientBloodGroup — e.g. "O-", "AB+"
 * @returns {string[]} Compatible donor blood groups
 */
function getCompatibleDonorGroups(recipientBloodGroup) {
  const compatible = COMPATIBILITY_MAP[recipientBloodGroup];
  if (!compatible) {
    throw new Error(`Invalid blood group: ${recipientBloodGroup}`);
  }
  return compatible;
}

/**
 * Check if a donor blood group is compatible with a recipient
 * @param {string} donorGroup
 * @param {string} recipientGroup
 * @returns {boolean}
 */
function isCompatible(donorGroup, recipientGroup) {
  return getCompatibleDonorGroups(recipientGroup).includes(donorGroup);
}

module.exports = { getCompatibleDonorGroups, isCompatible, COMPATIBILITY_MAP };
