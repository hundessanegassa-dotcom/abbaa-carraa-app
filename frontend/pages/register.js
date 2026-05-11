// Add this state
const [pendingGoogleRole, setPendingGoogleRole] = useState(null);

// Update the startGoogleLogin function
const startGoogleLogin = () => {
  if (!selectedRole) {
    toast.error('Please select a role first');
    return;
  }
  // Store the selected role before showing agreement
  setPendingGoogleRole(selectedRole);
  setShowAgreement(true);
};

// Update the handleGoogleAgreementAccept function
const handleGoogleAgreementAccept = async () => {
  setLoading(true);
  
  // Store the role for after Google login
  sessionStorage.setItem('pendingRole', pendingGoogleRole || selectedRole);
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  if (error) {
    toast.error(error.message);
    setLoading(false);
  }
  // No need to setLoading false - page redirects
};

// Also update the AgreementModal for Google flow
if (showAgreement) {
  const onAcceptHandler = pendingGoogleRole ? handleGoogleAgreementAccept : handleAgreementAccept;
  
  return (
    <AgreementModal
      role={selectedRole}
      onAccept={onAcceptHandler}
      onDecline={() => {
        setShowAgreement(false);
        setPendingGoogleRole(null);
      }}
    />
  );
}
