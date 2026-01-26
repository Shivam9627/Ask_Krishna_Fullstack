// Token Migration Helper
// This file helps migrate from old invalid tokens to new valid JWT tokens

export const validateAndCleanupToken = () => {
  const user = localStorage.getItem('user');
  
  if (!user) {
    console.log('✅ No user in localStorage');
    return;
  }

  try {
    const parsedUser = JSON.parse(user);
    const token = parsedUser.token;

    // Check if token is a valid JWT (3 parts separated by dots)
    if (!token) {
      console.log('❌ No token found, clearing localStorage');
      localStorage.removeItem('user');
      return false;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('❌ Invalid token format - expected 3 parts separated by dots, got:', parts.length);
      console.log('❌ Clearing invalid token from localStorage');
      console.log('Token preview:', token.substring(0, 100) + '...');
      localStorage.removeItem('user');
      return false;
    }

    // Validate that each part is valid base64
    try {
      const decoded = JSON.parse(
        Buffer.from(parts[1], 'base64').toString()
      );
      console.log('✅ Valid JWT found with user:', decoded.username);
      return true;
    } catch (e) {
      console.log('❌ Invalid JWT format - payload not valid base64:', e.message);
      localStorage.removeItem('user');
      return false;
    }
  } catch (e) {
    console.log('❌ Error validating token:', e.message);
    localStorage.removeItem('user');
    return false;
  }
};

export const clearInvalidTokens = () => {
  console.log('🧹 Checking for invalid tokens in localStorage...');
  const isValid = validateAndCleanupToken();
  if (!isValid) {
    console.log('💬 Please login again to get a new valid JWT token');
  }
  return isValid;
};
