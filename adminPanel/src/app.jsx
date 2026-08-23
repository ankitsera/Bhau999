/* eslint-disable perfectionist/sort-imports */
import 'src/global.css';

import { useScrollToTop } from 'src/hooks/use-scroll-to-top';

import Router from 'src/routes/sections';
import ThemeProvider from 'src/theme';
import { AuthProvider } from 'src/contexts/AuthContext';
import { UserProvider } from 'src/contexts/UserContext';
import { GameProvider } from 'src/contexts/GameContext';
import { TransactionProvider } from 'src/contexts/TransactionContext';
import { WithdrawalProvider } from 'src/contexts/WithdrawalContext';
import { BetProvider } from 'src/contexts/BetContext';

// ----------------------------------------------------------------------

export default function App() {
  useScrollToTop();

  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <GameProvider>
            <TransactionProvider>
              <WithdrawalProvider>
                <BetProvider>
                  <Router />
                </BetProvider>
              </WithdrawalProvider>
            </TransactionProvider>
          </GameProvider>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
