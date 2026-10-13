/**
 * @name 水泥集团系统管理后台(精简版)
 * @mode axure
 *
 * 参考资料：
 * - rules/axure-export-workflow.md
 * - rules/prototype-development-guide.md
 * - rules/axure-api-guide.md
 */

import React, { useMemo, useEffect } from 'react';
import {
    Building2,
    Users,
    ShieldCheck,
    KeyRound,
    Briefcase,
    Bell,
    Search,
} from 'lucide-react';
import { Layout, Menu, Button, Avatar, Badge } from 'antd';
import { defineHashPageRoute, useHashPage } from '../../common/useHashPage';
import {
    AnnotationViewer,
    type AnnotationDirectoryRouteNode,
    type AnnotationSourceDocument,
    type AnnotationViewerOptions,
} from '@axhub/annotation';
import annotationSourceDocument from './annotation-source.json';
import PositionPage from './pages/position';
import UserPage from './pages/user';
import RolePage from './pages/role';
import PermissionPage from './pages/permission';
import './style.css';

const { Header, Content } = Layout;

const route = defineHashPageRoute(
    [
        { id: 'permission', title: '权限管理' },
        { id: 'role', title: '角色管理' },
        { id: 'position', title: '岗位管理' },
        { id: 'user', title: '用户管理' },
    ],
    { defaultPageId: 'permission' },
);

const navItems = [
    { id: 'permission', title: '权限管理', icon: KeyRound },
    { id: 'role', title: '角色管理', icon: ShieldCheck },
    { id: 'position', title: '岗位管理', icon: Briefcase },
    { id: 'user', title: '用户管理', icon: Users },
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
                <span>水泥集团系统管理后台(精简版)</span>
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

    // 当 URL 指向不存在的页面时，自动重定向到默认页面（权限管理）
    useEffect(() => {
        if (!navItems.some((item) => item.id === page)) {
            setPage(route.defaultPageId);
        }
    }, [page, setPage]);

    // Expose annotation source & refresh helper for child pages
    // (e.g. to rescan markers after a Drawer/Modal opens)
    useEffect(() => {
        (window as any).__AXHUB_ANNOTATION_SOURCE__ = annotationSourceDocument;
        (window as any).__axhubAnnotationRefresh = () => {
            const runtime = (window as any).__AXHUB_ANNOTATION_RUNTIME__;
            if (runtime?.replaceSource) {
                runtime.replaceSource(annotationSourceDocument);
            }
        };
        return () => {
            delete (window as any).__AXHUB_ANNOTATION_SOURCE__;
            delete (window as any).__axhubAnnotationRefresh;
        };
    }, []);

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
            default:
                return (
                    <SafePage name="权限管理">
                        <PermissionPage />
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
                source={annotationSourceDocument as unknown as AnnotationSourceDocument}
                options={options}
            />
        </Layout>
    );
}
