'use client';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, ReactNode } from 'react';
import { Button, ConfigProvider, Layout, Menu, Tooltip } from 'antd';
import { useSignOut } from '@/features/sign-out';
import { LogoutOutlined } from '@ant-design/icons';
import navItems, { getMenuKeyByPathname, getPageHeadingByPathname } from './nav-items';

const { Content: Main, Footer, Sider } = Layout;

export default function ContractorLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { mutate: signOut } = useSignOut();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ConfigProvider theme={{ token: { fontSize: 14 } }}>
      <Layout className="h-screen-mobile-friendly">
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} breakpoint="lg" width={220}>
          <div className="min-h-[59px] flexRowCenter transition-none">
            {collapsed ? (
              <Image src="/icon_white.svg" alt="로고" width={20} height={20} />
            ) : (
              <Image src="/logo_white.svg" alt="로고" width={110} height={22} />
            )}
          </div>

          <Menu theme="dark" mode="inline" defaultSelectedKeys={[getMenuKeyByPathname(pathname)]} items={navItems} />
        </Sider>

        <Layout>
          <Layout.Header className="flex justify-between items-center px-4 text-white">
            <h1>{getPageHeadingByPathname(pathname)}</h1>

            <Tooltip title="로그아웃">
              <Button
                type="text"
                icon={<LogoutOutlined className="text-[22px]" />}
                onClick={() => signOut()}
                className="!text-white"
              />
            </Tooltip>
          </Layout.Header>

          <Main className="p-4 overflow-auto flex flex-col">{children}</Main>

          <Footer className="p-4 text-center">BLUEONE ©2014</Footer>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}
