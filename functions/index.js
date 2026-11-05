const { beforeUserCreated } = require("firebase-functions/v2/identity");

exports.setAuthenticatedClaim = beforeUserCreated(async (event) => {
  const existingClaims = event.data.customClaims ?? {};
  return {
    customClaims: {
      ...existingClaims,
      role: "authenticated",
    },
  };
});
