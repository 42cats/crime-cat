let _setUser: ((user: null) => void) | null = null;

export const registerSetUser = (setter: (user: null) => void) => {
  _setUser = setter;
};

export const resetUserState = () => {
  if (_setUser) {
    _setUser(null);
  }
};