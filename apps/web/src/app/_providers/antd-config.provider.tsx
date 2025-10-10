import { ReactNode } from 'react';
import { App, ConfigProvider } from 'antd';
import { ThemeConfig } from 'antd/lib';
import theme from '@/shared/ui/foundation/theme';

export default function AntdConfigProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={antdTheme}>
      <App message={{ maxCount: 2, duration: 4 }}>{children}</App>
    </ConfigProvider>
  );
}

const antdTheme: ThemeConfig = {
  hashed: false,
  token: {
    colorPrimary: theme.colors.primary,
    borderRadius: 4,
  },
  components: {
    Alert: {
      /**
       * `banner: true`일 때의 스타일 또한 덮어씌우기 위해 important 사용
       */
      colorInfoBorder: `${theme.colors.primary} !important`,
      colorInfoBg: 'none !important',
      colorInfoText: '#fff !important',
    },
    Tabs: {
      itemColor: '#fff',
      itemSelectedColor: theme.colors.primary,
      itemHoverColor: theme.colors.primary,
      inkBarColor: theme.colors.primary,
    },
  },
};
