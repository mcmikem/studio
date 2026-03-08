export const buildUploadPath = {
  profilePicture: (userId: string, extension: string) =>
    `profile-pictures/${userId}/profile.${extension}`,

  beneficiaryPhoto: (userId: string, fileName: string) =>
    `beneficiary-photos/${userId}/${Date.now()}_${fileName}`,

  ofaPlayerPhoto: (teamId: string, safeName: string, extension: string) =>
    `ofa-player-photos/${teamId}/${safeName}-${Date.now()}.${extension}`,

  testimonyMedia: (userId: string, fileName: string) =>
    `testimonies/${userId}/${Date.now()}_${fileName}`,
};
