import { NextAuthOptions } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import { SpotifyService } from "@/lib/spotify";

const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-read-private", 
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ");

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID || 'placeholder-client-id',
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || 'placeholder-client-secret',
      authorization: {
        params: {
          scope: SPOTIFY_SCOPES,
        },
      },
    }),
  ],
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at! * 1000,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          },
        } as any;
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to update it
      try {
        const response = await SpotifyService.refreshAccessToken(token.refreshToken as string);
        
        return {
          ...token,
          accessToken: response.access_token,
          accessTokenExpires: Date.now() + response.expires_in * 1000,
          refreshToken: response.refresh_token ?? token.refreshToken, // Fall back to old refresh token
        } as any;
      } catch (error) {
        console.error("Error refreshing access token", error);
        
        return {
          ...token,
          error: "RefreshAccessTokenError",
        } as any;
      }
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.error = token.error as string;
      session.user = {
        id: token.user?.id as string,
        name: token.user?.name as string,
        email: token.user?.email as string,
        image: token.user?.image as string,
      };
      
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'placeholder-secret',
};
