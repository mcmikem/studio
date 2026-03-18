const sanitizeFileName = (name: string) =>
  name
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/\.{2,}/g, '.');

export const buildUploadPath = {
  profilePicture: (userId: string, extension: string) =>
    `profile-pictures/${userId}/profile.${sanitizeFileName(extension)}`,

  beneficiaryPhoto: (userId: string, fileName: string) =>
    `beneficiary-photos/${userId}/${Date.now()}_${sanitizeFileName(fileName)}`,

  ofaPlayerPhoto: (teamId: string, safeName: string, extension: string) =>
    `ofa-player-photos/${teamId}/${sanitizeFileName(safeName)}-${Date.now()}.${sanitizeFileName(extension)}`,

  testimonyMedia: (userId: string, fileName: string) =>
    `testimonies/${userId}/${Date.now()}_${sanitizeFileName(fileName)}`,

  expenseReceipt: (userId: string, fileName: string) =>
    `expense-receipts/${userId}/${Date.now()}_${sanitizeFileName(fileName)}`,

  activityMedia: (userId: string, fileName: string) =>
    `activity-media/${userId}/${Date.now()}_${sanitizeFileName(fileName)}`,

  productImage: (categoryId: string, sku: string, extension: string) =>
    `products/${categoryId}/${sanitizeFileName(sku)}-${Date.now()}.${sanitizeFileName(extension)}`,
};
