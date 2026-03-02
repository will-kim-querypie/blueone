import passport from 'passport';
import { User } from '@/models';
import local from './local';

export default () => {
  passport.serializeUser<User['id']>((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser<User['id']>(async (id, done) => {
    try {
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
      });
      return done(null, user); // req.user
    } catch (err) {
      return done(err);
    }
  });

  local();
};
