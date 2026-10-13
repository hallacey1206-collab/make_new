/**
 * @name 停机管理原型
 * @mode axure
 */

import React, { useMemo, useState } from 'react';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SettingOutlined,
    BarChartOutlined,
    EditOutlined,
    DashboardOutlined,
    ControlOutlined,
} from '@ant-design/icons';
import {
    Avatar,
    Badge,
    Button,
    ConfigProvider,
    Dropdown,
    Layout,
    Menu,
    Space,
    theme,
} from 'antd';
import type { MenuProps } from 'antd';
import { defineHashPageRoute, useHashPage } from '../../common/useHashPage';
import {
    AnnotationViewer,
    type AnnotationDirectoryRouteNode,
    type AnnotationSourceDocument,
} from '@axhub/annotation';
import annotationSource from './annotation-source.json';
import {
    menuGroups,
    pageMeta,
    pageOrder,
    type MenuPageId,
} from './data';
import ReasonMaintenancePage from './reason-maintenance';
import CauseEntryPage from './cause-entry';
import DowntimeAnalysisPage from './downtime-analysis';
import StartStopConfigPage from './start-stop-config';
import './style.css';

const { Header, Sider, Content } = Layout;

const route = defineHashPageRoute(
    pageOrder.map((id) => ({
        id,
        title: pageMeta[id].title,
    })),
    { defaultPageId: 'reason-maintenance' },
);

const menuIconMap: Record<string, React.ReactNode> = {
    'reason-maintenance': <SettingOutlined />,
    'cause-entry': <EditOutlined />,
    'downtime-analysis': <BarChartOutlined />,
    'start-stop-config': <ControlOutlined />,
};

export default function Component() {
    const { page, setPage } = useHashPage(route);
    const [collapsed, setCollapsed] = useState(false);
    const menuItems: MenuProps['items'] = useMemo(() => {
        return menuGroups.map((group) => ({
            key: group.key,
            label: group.title,
            icon: <DashboardOutlined />,
            children: group.children.map((child) => ({
                key: child.id,
                label: child.title,
                icon: menuIconMap[child.id],
            })),
        }));
    }, []);

    // 找到当前页面所在的菜单组
    const currentGroupKey = useMemo(() => {
        const grp = menuGroups.find((g) => g.children.some((c) => c.id === page));
        return grp?.key || 'downtime';
    }, [page]);

    const handleMenuClick: MenuProps['onClick'] = (info) => {
        // 如果点击的是子菜单项，跳转对应页面
        if (pageOrder.includes(info.key as MenuPageId)) {
            setPage(info.key as MenuPageId);
        }
    };

    const renderPage = () => {
        switch (page) {
            case 'reason-maintenance':
                return <ReasonMaintenancePage />;
            case 'cause-entry':
                return <CauseEntryPage />;
            case 'downtime-analysis':
                return <DowntimeAnalysisPage />;
            case 'start-stop-config':
                return <StartStopConfigPage />;
            default:
                return <ReasonMaintenancePage />;
        }
    };

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#1677ff',
                    borderRadius: 8,
                },
            }}
        >
            <Layout className="dtm-shell">
                <Sider
                    className="dtm-sider"
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    width={220}
                    theme="light"
                >
                    <div className="dtm-brand">
                        <div className="dtm-brand-mark">DT</div>
                        {!collapsed && (
                            <div>
                                <h4 style={{ margin: 0, fontSize: 16, lineHeight: 1.2 }}>停机管理</h4>
                                <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>IPOM 停机分析系统</span>
                            </div>
                        )}
                    </div>
                    <Menu
                        className="dtm-menu"
                        mode="inline"
                        selectedKeys={[page]}
                        defaultOpenKeys={[currentGroupKey]}
                        items={menuItems}
                        onClick={handleMenuClick}
                    />
                </Sider>

                <Layout className="dtm-main">
                    <Header className="dtm-header">
                        <div className="dtm-header-row">
                            <div className="dtm-header-left">
                                <Button
                                    type="text"
                                    className="dtm-collapse-btn"
                                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                                    onClick={() => setCollapsed(!collapsed)}
                                />
                                <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                                    {pageMeta[page as MenuPageId]?.title || '停机管理'}
                                </span>
                            </div>
                            <div className="dtm-header-right">
                                <span className="dtm-greeting">您好，管理员</span>
                                <Avatar size="small" style={{ background: '#1677ff' }}>A</Avatar>
                            </div>
                        </div>
                    </Header>

                    <Content className="dtm-content">
                        {renderPage()}
                    </Content>
                </Layout>
            </Layout>

            {/* 需求说明标注 */}
            <AnnotationViewer
                source={annotationSource as unknown as AnnotationSourceDocument}
                options={{
                    currentPageId: page,
                    showToolbar: true,
                    showThemeToggle: true,
                    showColorFilter: true,
                    onDirectoryRoute: (node: AnnotationDirectoryRouteNode) => {
                        const routeId = node?.route;
                        if (routeId && pageOrder.includes(routeId as MenuPageId)) {
                            setPage(routeId as MenuPageId);
                        }
                    },
                }}
            />
        </ConfigProvider>
    );
}
