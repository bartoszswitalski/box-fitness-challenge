import { useAuthMutation } from '@box-fc/frontend/query';
import { useToast } from '@chakra-ui/react';
import { useGoogleLogin } from '@react-oauth/google';
import { defaultToastErrorOptions } from '../utils/toast/toast-info';
import { LoginButtonRaw } from './login-buton/LoginButton.raw';

export const LoginButton = () => {
    const toast = useToast();
    const googleLogin = useGoogleLogin({
        onSuccess: (codeResponse) => loginMutation.mutate(codeResponse.access_token),
        onError: ({ error_description }) => toast({ title: error_description, ...defaultToastErrorOptions }),
    });
    const onLoginError = (message: string) => toast({ title: message, ...defaultToastErrorOptions });
    const { loginMutation } = useAuthMutation({ onLoginError });

    return <LoginButtonRaw onCLick={googleLogin} isLoading={loginMutation.isLoading} />;
};
