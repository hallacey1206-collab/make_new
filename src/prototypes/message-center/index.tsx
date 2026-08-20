/**
 * @name 消息中心
 * @mode axure
 */

import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Badge } from 'antd';
import {
    BellOutlined,
    HomeOutlined,
    MessageOutlined,
    SettingOutlined,
    FileTextOutlined,
} from '@ant-design/icons';
import { AnnotationViewer, type AnnotationSourceDocument } from '@axhub/annotation';
import annotationSource from './annotation-source.json';
import MessageCenterApp from './MessageCenterApp';
import TemplateManageApp from './TemplateManageApp';
import './style.css';

const { Header, Content } = Layout;

export default function Component() {
    const [activePage, setActivePage] = useState<'message-center' | 'template-manage'>('message-center');

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            {/* 顶部导航栏 */}
            <Header
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 24px',
                    background: '#fff',
                    borderBottom: '1px solid #f0f0f0',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                }}
            >
                <div
                    style={{
                        fontSize: 18,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginRight: 32,
                        whiteSpace: 'nowrap',
                    }}
                >
                    <MessageOutlined style={{ color: '#1677ff', fontSize: 22 }} />
                    <span>消息中心</span>
                </div>

                <Menu
                    mode="horizontal"
                    selectedKeys={[activePage]}
                    onClick={({ key }) => setActivePage(key as 'message-center' | 'template-manage')}
                    items={[
                        {
                            key: 'message-center',
                            icon: <BellOutlined />,
                            label: '消息列表',
                        },
                        {
                            key: 'template-manage',
                            icon: <FileTextOutlined />,
                            label: '消息模板管理',
                        },
                    ]}
                    style={{ flex: 1, minWidth: 0, borderBottom: 'none' }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 16 }}>
                    <Button type="text" icon={<HomeOutlined />} title="首页" />
                    <Badge count={4} size="small">
                        <Button type="text" icon={<BellOutlined />} title="消息" />
                    </Badge>
                    <Button type="text" icon={<SettingOutlined />} title="设置" />
                    <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
                        管
                    </Avatar>
                </div>
            </Header>

            {/* 内容区 */}
            <Content style={{ padding: 0, overflow: 'auto' }}>
                {activePage === 'message-center' ? <MessageCenterApp /> : <TemplateManageApp />}
            </Content>

            <AnnotationViewer
                source={annotationSource as AnnotationSourceDocument}
                options={{
                    currentPageId: 'message-center',
                    showToolbar: true,
                    showThemeToggle: true,
                    showColorFilter: true,
                }}
            />
        </Layout>
    );
}
