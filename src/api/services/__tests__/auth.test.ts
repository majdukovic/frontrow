import { login, logout, getMe, forgotPassword, verifyOtp, resetPassword, updateProfile } from '../auth';
import { resetMockState, mockState } from '../../../mocks/state';

beforeEach(() => {
  resetMockState();
  mockState.sessions.clear();
});

describe('auth.login', () => {
  it('issues a token for a valid demo credential', async () => {
    const res = await login({ email: 'demo@frontrow.app', password: 'demo1234' });
    expect(res.token).toMatch(/^mock_usr_demo_/);
    expect(res.user.id).toBe('usr_demo');
    expect(res.user).not.toHaveProperty('password');
  });

  it('rejects bad password with 401', async () => {
    await expect(login({ email: 'demo@frontrow.app', password: 'nope' })).rejects.toMatchObject({
      status: 401,
      code: 'invalid_credentials',
    });
  });

  it('rejects locked account with 423', async () => {
    await expect(login({ email: 'locked@frontrow.app', password: 'wontwork' })).rejects.toMatchObject({
      status: 423,
      code: 'account_locked',
    });
  });
});

describe('auth.logout', () => {
  it('clears the session for the issued token', async () => {
    const { token } = await login({ email: 'demo@frontrow.app', password: 'demo1234' });
    expect(mockState.sessions.has(token)).toBe(true);
    await logout(token);
    expect(mockState.sessions.has(token)).toBe(false);
  });
});

describe('auth.getMe', () => {
  it('returns the user for a valid token', async () => {
    const { token } = await login({ email: 'demo@frontrow.app', password: 'demo1234' });
    const me = await getMe(token);
    expect(me.email).toBe('demo@frontrow.app');
  });

  it('rejects invalid tokens with 401', async () => {
    await expect(getMe('mock_bogus')).rejects.toMatchObject({ status: 401 });
  });
});

describe('auth.forgotPassword + verifyOtp + resetPassword', () => {
  it('end-to-end recovery flow lands a new password', async () => {
    await forgotPassword('demo@frontrow.app');
    const { resetToken } = await verifyOtp({
      email: 'demo@frontrow.app',
      code: '123456',
    });
    await resetPassword({ resetToken, newPassword: 'newpass1234' });
    await expect(login({ email: 'demo@frontrow.app', password: 'newpass1234' })).resolves.toBeTruthy();
  });

  it('rejects invalid OTP', async () => {
    await expect(
      verifyOtp({ email: 'demo@frontrow.app', code: '000000' }),
    ).rejects.toMatchObject({ code: 'invalid_otp' });
  });

  it('rejects short passwords', async () => {
    const { resetToken } = await verifyOtp({
      email: 'demo@frontrow.app',
      code: '123456',
    });
    await expect(resetPassword({ resetToken, newPassword: 'short' })).rejects.toMatchObject({
      code: 'weak_password',
    });
  });
});

describe('auth.updateProfile', () => {
  it('saves trimmed display name and bio', async () => {
    const { token } = await login({ email: 'demo@frontrow.app', password: 'demo1234' });
    const u = await updateProfile(token, { displayName: '  New Name  ', bio: '  New bio.  ' });
    expect(u.displayName).toBe('New Name');
    expect(u.bio).toBe('New bio.');
  });

  it('rejects empty display name', async () => {
    const { token } = await login({ email: 'demo@frontrow.app', password: 'demo1234' });
    await expect(
      updateProfile(token, { displayName: '   ', bio: '' }),
    ).rejects.toMatchObject({ code: 'invalid_displayName' });
  });

  it('rejects bio over 160 chars', async () => {
    const { token } = await login({ email: 'demo@frontrow.app', password: 'demo1234' });
    await expect(
      updateProfile(token, { displayName: 'X', bio: 'a'.repeat(161) }),
    ).rejects.toMatchObject({ code: 'invalid_bio' });
  });
});
