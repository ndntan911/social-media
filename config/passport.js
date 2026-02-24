const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const User = require("../models/User");

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        } else {
          // Check if user exists with same email
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
          } else {
            // Create new user
            const newUser = new User({
              googleId: profile.id,
              username:
                profile.emails[0].value.split("@")[0] +
                "_" +
                Math.random().toString(36).substring(7),
              email: profile.emails[0].value,
              fullName: profile.displayName,
              profilePicture: profile.photos[0].value,
              isVerified: true,
            });

            user = await newUser.save();
            return done(null, user);
          }
        }
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

// Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/api/auth/facebook/callback",
      profileFields: ["id", "emails", "name", "picture.type(large)"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ facebookId: profile.id });

        if (user) {
          return done(null, user);
        } else {
          // Check if user exists with same email
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Link Facebook account to existing user
            user.facebookId = profile.id;
            await user.save();
            return done(null, user);
          } else {
            // Create new user
            const newUser = new User({
              facebookId: profile.id,
              username:
                profile.emails[0].value.split("@")[0] +
                "_" +
                Math.random().toString(36).substring(7),
              email: profile.emails[0].value,
              fullName: profile.name.givenName + " " + profile.name.familyName,
              profilePicture: profile.photos[0].value,
              isVerified: true,
            });

            user = await newUser.save();
            return done(null, user);
          }
        }
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

// Serialize and deserialize user for session management
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
