/**
 * 企微端备案审批消息提醒页面
 * 模拟企业微信消息列表，展示备案审批待办消息
 */
import React, { useState } from 'react';
import {
    Badge,
    Button,
    Card,
    Divider,
    Empty,
    List,
    Space,
    Tag,
    Typography,
} from 'antd';
import {
    BellOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    LeftOutlined,
    RightOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

// 消息状态
type MsgStatus = 'unread' | 'read';
type MsgType = 'pending-review' | 'expert-assign' | 'approve' | 'return-notice' | 'approved-notice';

// 消息记录
interface FilingMsg {
    id: string;
    type: MsgType;
    title: string;
    projectName: string;
    orgName: string;
    applicant: string;
    projectLevel: 'key' | 'normal';
    submitTime: string;
    status: MsgStatus;
    summary: string;
}

const msgTypeMeta: Record<MsgType, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
    'pending-review': { label: '待审核', icon: <ClockCircleOutlined />, color: '#1677ff', bgColor: '#e6f4ff' },
    'expert-assign': { label: '专家指派', icon: <ExclamationCircleOutlined />, color: '#fa8c16', bgColor: '#fff7e6' },
    'approve': { label: '审批通过', icon: <CheckCircleOutlined />, color: '#52c41a', bgColor: '#f6ffed' },
    'return-notice': { label: '退回通知', icon: <ExclamationCircleOutlined />, color: '#ff4d4f', bgColor: '#fff2f0' },
    'approved-notice': { label: '通过通知', icon: <CheckCircleOutlined />, color: '#52c41a', bgColor: '#f6ffed' },
};

const projectLevelMap: Record<string, { label: string; color: string }> = {
    key: { label: '重点项目', color: 'red' },
    normal: { label: '普通项目', color: 'blue' },
};

// 模拟消息数据
const MOCK_MESSAGES: FilingMsg[] = [
    {
        id: 'msg-1',
        type: 'pending-review',
        title: '备案审批待办',
        projectName: '中材南京数字化平台升级项目',
        orgName: '中材国际',
        applicant: '张工',
        projectLevel: 'key',
        submitTime: '2026-07-10 09:30',
        status: 'unread',
        summary: '您有一条新的备案审批待办，请及时处理。',
    },
    {
        id: 'msg-2',
        type: 'expert-assign',
        title: '专家评审指派',
        projectName: '中国建材装备集团智能制造项目',
        orgName: '中材国际',
        applicant: '李工',
        projectLevel: 'key',
        submitTime: '2026-07-10 08:15',
        status: 'unread',
        summary: '备案项目已指派给您进行专家评审，请在48小时内完成评审。',
    },
    {
        id: 'msg-3',
        type: 'return-notice',
        title: '备案退回通知',
        projectName: '合肥装备科技数据看板项目',
        orgName: '合肥装备科技',
        applicant: '王工',
        projectLevel: 'normal',
        submitTime: '2026-07-09 16:40',
        status: 'unread',
        summary: '备案申请已被退回，退回原因：项目预算信息不完整，请补充后重新提交。',
    },
    {
        id: 'msg-4',
        type: 'pending-review',
        title: '备案审批待办',
        projectName: '成都建材院数字底座优化',
        orgName: '成都建材院',
        applicant: '陈工',
        projectLevel: 'key',
        submitTime: '2026-07-09 14:20',
        status: 'read',
        summary: '您有一条新的备案审批待办，请及时处理。',
    },
    {
        id: 'msg-5',
        type: 'approved-notice',
        title: '备案通过通知',
        projectName: '中材矿山智慧矿山管理系统',
        orgName: '中材矿山',
        applicant: '刘工',
        projectLevel: 'normal',
        submitTime: '2026-07-09 11:00',
        status: 'read',
        summary: '您提交的备案项目已通过审批，请及时查看。',
    },
    {
        id: 'msg-6',
        type: 'approve',
        title: '业务域审批待办',
        projectName: '中材国际工地协同执行平台',
        orgName: '中材国际',
        applicant: '周工',
        projectLevel: 'key',
        submitTime: '2026-07-08 15:30',
        status: 'read',
        summary: '备案项目已进入业务域评审阶段，请进行审批。',
    },
    {
        id: 'msg-7',
        type: 'pending-review',
        title: '备案审批待办',
        projectName: '合肥水泥研究院预算联动系统',
        orgName: '合肥水泥研究院',
        applicant: '赵工',
        projectLevel: 'normal',
        submitTime: '2026-07-08 10:05',
        status: 'read',
        summary: '您有一条新的备案审批待办，请及时处理。',
    },
];

export default function FilingWecomMsgPage() {
    const [messages, setMessages] = useState<FilingMsg[]>(MOCK_MESSAGES);
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

    const unreadCount = messages.filter(m => m.status === 'unread').length;
    const filteredMessages = activeTab === 'unread'
        ? messages.filter(m => m.status === 'unread')
        : messages;

    const handleMarkRead = (id: string) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'read' as MsgStatus } : m));
    };

    const handleMarkAllRead = () => {
        setMessages(prev => prev.map(m => ({ ...m, status: 'read' as MsgStatus })));
    };

    return (
        <div className="wecom-shell">
            {/* 企微顶部导航 */}
            <div className="wecom-header">
                <div className="wecom-header-inner">
                    <LeftOutlined className="wecom-header-back" />
                    <span className="wecom-header-title">备案审批通知</span>
                    <Badge count={unreadCount} size="small">
                        <BellOutlined style={{ fontSize: 18, color: '#fff' }} />
                    </Badge>
                </div>
            </div>

            {/* Tab 切换 */}
            <div className="wecom-tabs">
                <div
                    className={`wecom-tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    全部
                </div>
                <div
                    className={`wecom-tab ${activeTab === 'unread' ? 'active' : ''}`}
                    onClick={() => setActiveTab('unread')}
                >
                    未读{unreadCount > 0 && <span className="wecom-tab-badge">{unreadCount}</span>}
                </div>
                {unreadCount > 0 && (
                    <Button type="link" size="small" onClick={handleMarkAllRead} style={{ marginLeft: 'auto', color: '#1677ff', fontSize: 13 }}>
                        全部已读
                    </Button>
                )}
            </div>

            {/* 消息列表 */}
            <div className="wecom-msg-list">
                {filteredMessages.length === 0 ? (
                    <Empty description="暂无消息" style={{ marginTop: 80 }} />
                ) : (
                    <List
                        dataSource={filteredMessages}
                        renderItem={(msg) => {
                            const meta = msgTypeMeta[msg.type];
                            const levelInfo = projectLevelMap[msg.projectLevel];
                            return (
                                <div
                                    key={msg.id}
                                    className={`wecom-msg-card ${msg.status === 'unread' ? 'unread' : ''}`}
                                    onClick={() => {
                                        if (msg.status === 'unread') handleMarkRead(msg.id);
                                        // 在原型中跳转到详情页
                                        window.location.hash = 'page=filing-wecom-detail&msgId=' + msg.id;
                                    }}
                                >
                                    <div className="wecom-msg-card-header">
                                        <div className="wecom-msg-type-tag" style={{ backgroundColor: meta.bgColor, color: meta.color }}>
                                            {meta.icon}
                                            <span style={{ marginLeft: 4 }}>{meta.label}</span>
                                        </div>
                                        {msg.status === 'unread' && <div className="wecom-msg-dot" />}
                                        <Text type="secondary" style={{ fontSize: 12, marginLeft: 'auto' }}>{msg.submitTime}</Text>
                                    </div>
                                    <div className="wecom-msg-card-body">
                                        <Text strong style={{ fontSize: 15 }}>{msg.projectName}</Text>
                                        <div className="wecom-msg-card-meta">
                                            <Space size={8}>
                                                <Tag color={levelInfo.color} style={{ fontSize: 11, lineHeight: '18px', padding: '0 4px' }}>
                                                    {levelInfo.label}
                                                </Tag>
                                                <Text type="secondary" style={{ fontSize: 12 }}>{msg.orgName}</Text>
                                            </Space>
                                            <Text type="secondary" style={{ fontSize: 12 }}>申请人：{msg.applicant}</Text>
                                        </div>
                                        <Text type="secondary" style={{ fontSize: 13 }}>{msg.summary}</Text>
                                    </div>
                                    <div className="wecom-msg-card-footer">
                                        <span style={{ color: '#1677ff', fontSize: 13 }}>查看详情</span>
                                        <RightOutlined style={{ fontSize: 11, color: '#1677ff' }} />
                                    </div>
                                </div>
                            );
                        }}
                    />
                )}
            </div>
        </div>
    );
}
