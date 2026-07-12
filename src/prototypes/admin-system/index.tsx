/**
 * @name 水泥集团系统管理后台
 * @mode axure
 */

import React, { useMemo, useEffect } from 'react';
import {
    Building2,
    Users,
    ShieldCheck,
    KeyRound,
    Briefcase,
    FileCog,
    Bell,
    Search,
    Factory,
} from 'lucide-react';
import { Layout, Menu, Button, Avatar, Badge } from 'antd';
import { defineHashPageRoute, useHashPage } from '../../common/useHashPage';
import {
    AnnotationViewer,
    type AnnotationDirectoryRouteNode,
    type AnnotationSourceDocument,
    type AnnotationViewerOptions,
} from '@axhub/annotation';
import annotationSource from './annotation-source.json';
import OrgPage from './pages/org';
import PositionPage from './pages/position';
import UserPage from './pages/user';
import RolePage from './pages/role';
import PermissionPage from './pages/permission';
import RulePage from './pages/rule';
import ProductionLinePage from './pages/production-line';
import './style.css';

const { Header, Content } = Layout;

const route = defineHashPageRoute(
    [
        { id: 'org', title: '组织架构管理' },
        { id: 'production-line', title: '产线配置' },
        { id: 'permission', title: '权限管理' },
        { id: 'role', title: '角色管理' },
        { id: 'position', title: '岗位管理' },
        { id: 'user', title: '用户管理' },
        { id: 'rule', title: '业务规则配置' },
    ],
    { defaultPageId: 'org' },
);

const navItems = [
    { id: 'org', title: '组织架构', icon: Building2 },
    { id: 'production-line', title: '产线配置', icon: Factory },
    { id: 'permission', title: '权限管理', icon: KeyRound },
    { id: 'role', title: '角色管理', icon: ShieldCheck },
    { id: 'position', title: '岗位管理', icon: Briefcase },
    { id: 'user', title: '用户管理', icon: Users },
    { id: 'rule', title: '业务规则', icon: FileCog },
];

function TopNav({ activeId, onChange }: { activeId: string; onChange: (id: string) => void }) {
    const menuItems = navItems.map((item) => ({
        key: item.id,
        icon: <item.icon size={15} />,
        label: item.title,
    }));

    return (
        <Header data-annotation-id="admin-topnav" style={{ display: 'flex', alignItems: 'center', padding: '0 24px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, marginRight: 24, whiteSpace: 'nowrap' }}>
                <Building2 size={18} strokeWidth={2} />
                <span>IPOM系统管理后台</span>
            </div>
            <Menu
                mode="horizontal"
                selectedKeys={[activeId]}
                items={menuItems}
                onClick={(e) => onChange(e.key)}
                style={{ flex: 1, minWidth: 0, borderBottom: 'none' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 16 }}>
                <Button type="text" icon={<Search size={16} />} title="搜索" />
                <Badge count={5} size="small">
                    <Button type="text" icon={<Bell size={16} />} title="通知" />
                </Badge>
                <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>AD</Avatar>
            </div>
        </Header>
    );
}

function PageError({ name, error }: { name: string; error: any }) {
    return (
        <div style={{ padding: 40, color: '#ff4d4f' }}>
            <h3>「{name}」页面渲染错误</h3>
            <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, overflow: 'auto' }}>
                {error?.message || String(error)}
            </pre>
        </div>
    );
}

function SafePage({ name, children }: { name: string; children: React.ReactNode }) {
    try {
        return <>{children}</>;
    } catch (err: any) {
        return <PageError name={name} error={err} />;
    }
}

export default function Component() {
    const { page, setPage } = useHashPage(route);

    // Auto-stabilize: ensure every annotation node has [data-annotation-id="<id>"] as the first
    // selector, so the AnnotationViewer always tries the stable selector before fragile ones
    // (e.g. auto-generated IDs like #rc-tabs-0-tab-field that break on re-render).
    const stabilizedSource = useMemo(() => {
        const src = annotationSource as AnnotationSourceDocument;
        const data = src.data;
        if (!data?.nodes) return src;
        const nodes = data.nodes.map(node => {
            const stableSelector = `[data-annotation-id="${node.id}"]`;
            const selectors = node.locator.selectors;
            if (selectors[0] === stableSelector) return node;
            const cleaned = selectors.filter((s: string) => s !== stableSelector);
            const fixed = [stableSelector, ...cleaned];
            return { ...node, locator: { ...node.locator, selectors: fixed } };
        });
        return { ...src, data: { ...data, nodes } } as AnnotationSourceDocument;
    }, []);

    // Expose annotation source & refresh helper for child pages
    // (e.g. to rescan markers after a Drawer/Modal opens)
    useEffect(() => {
        (window as any).__AXHUB_ANNOTATION_SOURCE__ = stabilizedSource;
        (window as any).__axhubAnnotationRefresh = () => {
            const runtime = (window as any).__AXHUB_ANNOTATION_RUNTIME__;
            if (runtime?.replaceSource) {
                runtime.replaceSource(stabilizedSource);
            }
        };
        return () => {
            delete (window as any).__AXHUB_ANNOTATION_SOURCE__;
            delete (window as any).__axhubAnnotationRefresh;
        };
    }, [stabilizedSource]);

    const options = useMemo<AnnotationViewerOptions>(() => ({
        currentPageId: page,
        showToolbar: true,
        showThemeToggle: false,
        showColorFilter: true,
        onDirectoryRoute: (node: AnnotationDirectoryRouteNode) => {
            setPage(node.route);
        },
    }), [page, setPage]);

    const renderPage = () => {
        switch (page) {
            case 'org':
                return (
                    <SafePage name="组织架构管理">
                        <OrgPage />
                    </SafePage>
                );
            case 'position':
                return (
                    <SafePage name="岗位管理">
                        <PositionPage />
                    </SafePage>
                );
            case 'user':
                return (
                    <SafePage name="用户管理">
                        <UserPage />
                    </SafePage>
                );
            case 'role':
                return (
                    <SafePage name="角色管理">
                        <RolePage />
                    </SafePage>
                );
            case 'permission':
                return (
                    <SafePage name="权限管理">
                        <PermissionPage />
                    </SafePage>
                );
            case 'rule':
                return (
                    <SafePage name="业务规则配置">
                        <RulePage />
                    </SafePage>
                );
            case 'production-line':
                return (
                    <SafePage name="产线配置">
                        <ProductionLinePage />
                    </SafePage>
                );
            default:
                return (
                    <SafePage name="组织架构管理">
                        <OrgPage />
                    </SafePage>
                );
        }
    };

    return (
        <Layout className="admin-shell" style={{ minHeight: '100vh' }}>
            <TopNav activeId={page} onChange={setPage} />
            <Content style={{ padding: 24, background: '#f5f5f5', overflow: 'auto' }}>
                {renderPage()}
            </Content>
            <AnnotationViewer
                source={stabilizedSource}
                options={options}
            />
        </Layout>
    );
}
