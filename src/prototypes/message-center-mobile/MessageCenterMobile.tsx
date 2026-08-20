/**
 * 消息中心 - 移动端页面
 * 遵循项目移动端规范：max-width 430px、红色主题色、独立渲染
 */
import React, { useMemo, useState } from 'react';
import {
    ArrowLeftOutlined,
    BellOutlined,
    CheckCircleOutlined,
    CheckOutlined,
    ClockCircleOutlined,
    CloseOutlined,
    ExclamationCircleOutlined,
    FileTextOutlined,
    FilterOutlined,
    MailOutlined,
    SearchOutlined,
    SettingOutlined,
    ToolOutlined,
} from '@ant-design/icons';
import {
    Badge,
    Button,
    DatePicker,
    Drawer,
    Empty,
    Input,
    Switch,
    Tag,
    Timeline,
    Typography,
    message,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { TextArea } = Input;

// ============ 类型定义 ============

type MessageType = 'notification' | 'approval' | 'alarm' | 'system';
type Priority = 'urgent' | 'normal';
type SpecialtyType = 'equipment' | 'production' | 'quality';
type MessageStatus = 'unread' | 'read';

type MessageItem = {
    id: string;
    type: MessageType;
    specialty: SpecialtyType;
    priority: Priority;
    status: MessageStatus;
    title: string;
    summary: string;
    sender: string;
    time: string;
    date: string;
    approvalCode?: string;
    approvalForm?: {
        equipmentName?: string;
        faultDesc?: string;
        repairType?: string;
        estimatedCost?: string;
    };
    approvalTimeline?: Array<{
        status: 'completed' | 'current' | 'pending';
        title: string;
        person: string;
        time: string;
    }>;
    content?: string;
    attachments?: Array<{ name: string; size: string }>;
    alarmInfo?: {
        deviceName: string;
        alarmCode: string;
        alarmLevel: string;
        alarmValue: string;
        threshold: string;
        location: string;
    };
};

type TabKey = 'all' | 'notification' | 'approval' | 'alarm' | 'system';

// ============ 常量 ============

const SPECIALTY_MAP: Record<SpecialtyType, { label: string; color: string }> = {
    equipment: { label: '设备', color: 'blue' },
    production: { label: '生产', color: 'green' },
    quality: { label: '质量', color: 'purple' },
};

const TYPE_MAP: Record<MessageType, { label: string; color: string; icon: React.ReactNode }> = {
    notification: { label: '通知', color: 'blue', icon: <MailOutlined /> },
    approval: { label: '审批', color: 'orange', icon: <FileTextOutlined /> },
    alarm: { label: '报警', color: 'red', icon: <BellOutlined /> },
    system: { label: '系统', color: 'default', icon: <SettingOutlined /> },
};

const TAB_LIST: Array<{ key: TabKey; label: string }> = [
    { key: 'all', label: '全部' },
    { key: 'notification', label: '通知' },
    { key: 'approval', label: '审批' },
    { key: 'alarm', label: '报警' },
    { key: 'system', label: '系统' },
];

// ============ 模拟数据 ============

const MOCK_MESSAGES: MessageItem[] = [
    {
        id: 'msg-001',
        type: 'notification',
        specialty: 'equipment',
        priority: 'urgent',
        status: 'unread',
        title: '3号锅炉停机告警通知',
        summary: '设备运维系统推送的紧急停机告警，请及时确认处理',
        sender: '设备运维系统',
        time: '10:30',
        date: dayjs().format('YYYY-MM-DD'),
        content: '3号锅炉于今日10:28发生异常停机，故障代码E-3021，初步判断为轴承温度过高触发保护停机。请相关运维人员立即到场检查，确认设备状态后方可重启。\n\n停机前运行参数：\n- 蒸汽压力：3.2 MPa\n- 排烟温度：168°C\n- 轴承温度：92°C（报警阈值85°C）',
        attachments: [{ name: '停机告警截图.jpg', size: '128KB' }],
    },
    {
        id: 'msg-002',
        type: 'approval',
        specialty: 'equipment',
        priority: 'normal',
        status: 'unread',
        title: '维修工单待审批 - WO20260728001',
        summary: '张明提交的设备维修工单等待您审批',
        sender: '张明',
        time: '09:15',
        date: dayjs().format('YYYY-MM-DD'),
        approvalCode: 'WO20260728001',
        approvalForm: {
            equipmentName: '3号锅炉给水泵',
            faultDesc: '运行异响，轴承温度过高',
            repairType: '紧急维修',
            estimatedCost: '¥28,500.00',
        },
        approvalTimeline: [
            { status: 'completed', title: '提交申请', person: '张明', time: '07-28 09:15' },
            { status: 'completed', title: '一级审批通过', person: '李工', time: '07-28 10:00' },
            { status: 'current', title: '二级审批', person: '王芳', time: '审批中...' },
            { status: 'pending', title: '完成', person: '-', time: '' },
        ],
    },
    {
        id: 'msg-003',
        type: 'notification',
        specialty: 'equipment',
        priority: 'normal',
        status: 'unread',
        title: '本月设备维保计划已发布',
        summary: '设备管理部门发布的月度维保计划',
        sender: '设备管理部',
        time: '08:30',
        date: dayjs().format('YYYY-MM-DD'),
        content: '2026年7月设备维保计划已发布，请各位设备负责人按计划执行维保任务。\n\n本月重点维保项目：\n1. 3号锅炉定期检修（7月15日-7月18日）\n2. 生产线输送带更换（7月20日-7月22日）\n3. 空压机系统保养（7月25日-7月26日）',
    },
    {
        id: 'msg-004',
        type: 'notification',
        specialty: 'production',
        priority: 'normal',
        status: 'read',
        title: '生产排产周报',
        summary: '本周生产排产完成情况汇总',
        sender: '生产管理部',
        time: '昨天',
        date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        content: '本周生产排产完成情况良好，整体达成率96.5%。',
    },
    {
        id: 'msg-005',
        type: 'approval',
        specialty: 'quality',
        priority: 'normal',
        status: 'unread',
        title: '质量检验不合格品处置单待审批',
        summary: '张三提交的质量不合格品处置申请',
        sender: '张三',
        time: '11:00',
        date: dayjs().format('YYYY-MM-DD'),
        approvalCode: 'QNC20260728002',
        approvalForm: {
            equipmentName: '水泥熟料批次C-20260728-A',
            faultDesc: '游离氧化钙含量超标',
            repairType: '不合格品处置',
            estimatedCost: '¥5,200.00',
        },
        approvalTimeline: [
            { status: 'completed', title: '提交申请', person: '张三', time: '07-28 11:00' },
            { status: 'current', title: '质量主管审批', person: '当前用户', time: '审批中...' },
            { status: 'pending', title: '完成', person: '-', time: '' },
        ],
    },
    {
        id: 'msg-006',
        type: 'system',
        specialty: 'equipment',
        priority: 'normal',
        status: 'read',
        title: '系统维护通知',
        summary: '平台将于今晚22:00进行例行维护',
        sender: '系统管理员',
        time: '昨天',
        date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        content: '平台将于今晚22:00-23:00进行例行系统维护，期间部分功能可能不可用，请提前保存工作。',
    },
    {
        id: 'msg-007',
        type: 'alarm',
        specialty: 'equipment',
        priority: 'urgent',
        status: 'unread',
        title: '3号锅炉轴承温度超标报警',
        summary: '设备运维系统推送的实时报警，轴承温度超过安全阈值',
        sender: '设备运维系统',
        time: '10:28',
        date: dayjs().format('YYYY-MM-DD'),
        content: '3号锅炉给水泵轴承温度实时监测值超过设定阈值，请立即确认并处理。\n\n报警详情：\n- 监测点位：3号锅炉给水泵驱动端轴承\n- 报警类型：温度超标\n- 建议措施：立即停机检查轴承润滑及冷却系统',
        alarmInfo: {
            deviceName: '3号锅炉给水泵',
            alarmCode: 'ALM-EQP-20260728-001',
            alarmLevel: '紧急',
            alarmValue: '92°C',
            threshold: '85°C',
            location: '3号锅炉房',
        },
    },
    {
        id: 'msg-008',
        type: 'alarm',
        specialty: 'production',
        priority: 'normal',
        status: 'unread',
        title: '熟料生产线电流异常报警',
        summary: '生产线主电机电流波动超出正常范围',
        sender: '生产监控系统',
        time: '09:45',
        date: dayjs().format('YYYY-MM-DD'),
        content: '熟料生产线主电机电流监测到异常波动，需安排人员现场确认。',
        alarmInfo: {
            deviceName: '熟料生产线主电机',
            alarmCode: 'ALM-PRD-20260728-002',
            alarmLevel: '一般',
            alarmValue: '185A',
            threshold: '160A',
            location: '熟料车间',
        },
    },
];

// ============ 主题色 ============

const THEME = {
    primary: '#e60012',
    primaryLight: '#fff1f0',
    bg: '#f5f5f5',
    cardBg: '#fff',
    textPrimary: '#262626',
    textSecondary: '#8c8c8c',
    border: '#f0f0f0',
    danger: '#ff4d4f',
    warning: '#fa8c16',
    success: '#52c41a',
};

// ============ 主组件 ============

export default function MessageCenterMobile() {
    const [activeTab, setActiveTab] = useState<TabKey>('all');
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
    const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [urgentOnly, setUrgentOnly] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [messages, setMessages] = useState<MessageItem[]>(MOCK_MESSAGES);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null);
    const [approvalOpinion, setApprovalOpinion] = useState('');
    const [filterPopupOpen, setFilterPopupOpen] = useState(false);
    const [searchBarOpen, setSearchBarOpen] = useState(false);
    const [handledIds, setHandledIds] = useState<Set<string>>(new Set());

    const todayStr = dayjs().format('YYYY-MM-DD');
    const isToday = selectedDate.format('YYYY-MM-DD') === todayStr;

    // 未读数统计
    const unreadCounts = useMemo(() => {
        const dateStr = selectedDate.format('YYYY-MM-DD');
        const dayMessages = messages.filter((m) => m.date === dateStr);
        return {
            all: dayMessages.filter((m) => m.status === 'unread').length,
            notification: dayMessages.filter((m) => m.type === 'notification' && m.status === 'unread').length,
            approval: dayMessages.filter((m) => m.type === 'approval' && m.status === 'unread').length,
            alarm: dayMessages.filter((m) => m.type === 'alarm' && m.status === 'unread').length,
            system: dayMessages.filter((m) => m.type === 'system' && m.status === 'unread').length,
        };
    }, [messages, selectedDate]);

    // 筛选逻辑
    const filteredMessages = useMemo(() => {
        const dateStr = selectedDate.format('YYYY-MM-DD');
        let result = messages.filter((m) => m.date === dateStr);

        if (activeTab !== 'all') {
            result = result.filter((m) => m.type === activeTab);
        }
        if (specialtyFilter !== 'all') {
            result = result.filter((m) => m.specialty === specialtyFilter);
        }
        if (unreadOnly) {
            result = result.filter((m) => m.status === 'unread');
        }
        if (urgentOnly) {
            result = result.filter((m) => m.priority === 'urgent');
        }
        if (searchKeyword.trim()) {
            const kw = searchKeyword.trim().toLowerCase();
            result = result.filter(
                (m) =>
                    m.title.toLowerCase().includes(kw) ||
                    m.summary.toLowerCase().includes(kw) ||
                    m.sender.toLowerCase().includes(kw)
            );
        }

        return result.sort((a, b) => {
            if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
            if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
            if (a.status === 'unread' && b.status === 'read') return -1;
            if (a.status === 'read' && b.status === 'unread') return 1;
            return b.time.localeCompare(a.time);
        });
    }, [messages, activeTab, selectedDate, specialtyFilter, unreadOnly, urgentOnly, searchKeyword]);

    const urgentMessages = filteredMessages.filter((m) => m.priority === 'urgent');
    const normalMessages = filteredMessages.filter((m) => m.priority !== 'urgent');

    // 操作方法
    const handleMarkAllRead = () => {
        const dateStr = selectedDate.format('YYYY-MM-DD');
        setMessages((prev) =>
            prev.map((m) => (m.date === dateStr && m.status === 'unread' ? { ...m, status: 'read' as const } : m))
        );
        message.success('已全部标记为已读');
    };

    const handleMarkRead = (id: string) => {
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'read' as const } : m)));
    };

    const handleOpenDetail = (msg: MessageItem) => {
        setSelectedMessage(msg);
        setDrawerOpen(true);
        if (msg.status === 'unread') {
            handleMarkRead(msg.id);
        }
    };

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
        setSelectedMessage(null);
        setApprovalOpinion('');
    };

    const handleApprove = (action: 'approve' | 'reject' | 'transfer') => {
        if (action === 'reject' && !approvalOpinion.trim()) {
            message.warning('退回操作需要填写审批意见');
            return;
        }
        const actionText = action === 'approve' ? '通过' : action === 'reject' ? '退回' : '转交';
        if (selectedMessage) {
            setHandledIds((prev) => new Set(prev).add(selectedMessage.id));
        }
        message.success(`已${actionText}该审批单`);
        handleCloseDrawer();
    };

    const handleAlarmAction = (action: 'repair' | 'postpone' | 'done' | 'ignore') => {
        const actionMap: Record<string, string> = {
            repair: '发起检维修',
            postpone: '暂不处理',
            done: '已处理完毕',
            ignore: '无需处理',
        };
        if (selectedMessage) {
            setHandledIds((prev) => new Set(prev).add(selectedMessage.id));
        }
        message.success(`已确认：${actionMap[action]}`);
        handleCloseDrawer();
    };

    const activeFilterCount = specialtyFilter !== 'all' ? 1 : 0;

    // ============ 消息卡片 ============

    const renderMessageCard = (msg: MessageItem) => {
        const isUnread = msg.status === 'unread';
        const isUrgent = msg.priority === 'urgent';
        const typeInfo = TYPE_MAP[msg.type];
        const specialtyInfo = SPECIALTY_MAP[msg.specialty];

        return (
            <div
                key={msg.id}
                onClick={() => handleOpenDetail(msg)}
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '14px 16px',
                    borderBottom: `1px solid ${THEME.border}`,
                    background: isUrgent ? THEME.primaryLight : THEME.cardBg,
                    cursor: 'pointer',
                    activeBg: isUrgent ? '#ffebe8' : '#fafafa',
                }}
            >
                {/* 左侧未读红点 */}
                {isUnread && (
                    <div
                        style={{
                            width: 8,
                            height: 8,
                            minWidth: 8,
                            borderRadius: '50%',
                            background: THEME.danger,
                            marginRight: 10,
                            marginTop: 6,
                            flexShrink: 0,
                        }}
                    />
                )}

                {/* 类型图标 */}
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: isUrgent ? THEME.danger : typeInfo.color === 'blue' ? '#e6f4ff' : typeInfo.color === 'orange' ? '#fff7e6' : typeInfo.color === 'red' ? '#fff1f0' : '#f5f5f5',
                        color: isUrgent ? '#fff' : typeInfo.color === 'blue' ? '#1677ff' : typeInfo.color === 'orange' ? THEME.warning : typeInfo.color === 'red' ? THEME.danger : '#8c8c8c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        marginRight: 12,
                        flexShrink: 0,
                    }}
                >
                    {typeInfo.icon}
                </div>

                {/* 中间内容 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                        <Text
                            strong={isUnread}
                            style={{
                                fontSize: 14,
                                color: isUnread ? THEME.textPrimary : THEME.textSecondary,
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {msg.title}
                        </Text>
                    </div>
                    <Text
                        type="secondary"
                        style={{
                            fontSize: 12,
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginBottom: 6,
                        }}
                    >
                        {msg.summary}
                    </Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Tag
                            color={specialtyInfo.color}
                            style={{ fontSize: 11, lineHeight: '18px', padding: '0 4px', margin: 0 }}
                        >
                            {specialtyInfo.label}
                        </Tag>
                        <Tag
                            color={typeInfo.color}
                            style={{ fontSize: 11, lineHeight: '18px', padding: '0 4px', margin: 0 }}
                        >
                            {typeInfo.label}
                        </Tag>
                        {isUrgent && (
                            <Tag color="red" style={{ fontSize: 11, lineHeight: '18px', padding: '0 4px', margin: 0 }}>
                                紧急
                            </Tag>
                        )}
                    </div>
                </div>

                {/* 右侧时间和操作按钮 */}
                <div style={{ flexShrink: 0, textAlign: 'right', marginLeft: 8, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                        {isToday ? msg.time : msg.date}
                    </Text>
                    {!handledIds.has(msg.id) && (
                        msg.type === 'approval' ? (
                            <Button
                                size="small"
                                type="primary"
                                style={{ fontSize: 12, borderRadius: 4 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDetail(msg);
                                }}
                            >
                                去审批
                            </Button>
                        ) : msg.type === 'alarm' ? (
                            <Button
                                size="small"
                                type="primary"
                                danger
                                style={{ fontSize: 12, borderRadius: 4 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDetail(msg);
                                }}
                            >
                                去处理
                            </Button>
                        ) : (
                            <Button
                                size="small"
                                style={{ fontSize: 12, borderRadius: 4 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDetail(msg);
                                }}
                            >
                                查看详情
                            </Button>
                        )
                    )}
                </div>
            </div>
        );
    };

    // ============ 通知详情 ============

    const renderNotificationDetail = (msg: MessageItem) => (
        <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                <Tag color={TYPE_MAP[msg.type].color}>{TYPE_MAP[msg.type].label}</Tag>
                <Tag color={SPECIALTY_MAP[msg.specialty].color}>{SPECIALTY_MAP[msg.specialty].label}</Tag>
                {msg.priority === 'urgent' && <Tag color="red">紧急</Tag>}
            </div>
            <Title level={4} style={{ marginBottom: 6, fontSize: 17 }}>
                {msg.title}
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontSize: 13 }}>
                {msg.sender} · {msg.date} {msg.time}
            </Text>
            <div
                style={{
                    padding: 14,
                    background: '#f6ffed',
                    borderRadius: 8,
                    border: '1px solid #b7eb8f',
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                    fontSize: 14,
                }}
            >
                {msg.content}
            </div>
            {msg.attachments && msg.attachments.length > 0 && (
                <div style={{ marginTop: 20 }}>
                    <Text strong style={{ display: 'block', marginBottom: 10, fontSize: 14 }}>
                        附件
                    </Text>
                    {msg.attachments.map((att) => (
                        <div
                            key={att.name}
                            style={{
                                padding: '10px 12px',
                                background: '#fafafa',
                                borderRadius: 8,
                                marginBottom: 8,
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <FileTextOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                            <Text style={{ fontSize: 13 }}>{att.name}</Text>
                            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>({att.size})</Text>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // ============ 审批详情 ============

    const renderApprovalDetail = (msg: MessageItem) => (
        <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                <Tag color={TYPE_MAP[msg.type].color}>{TYPE_MAP[msg.type].label}</Tag>
                <Tag color={SPECIALTY_MAP[msg.specialty].color}>{SPECIALTY_MAP[msg.specialty].label}</Tag>
            </div>
            <Title level={4} style={{ marginBottom: 6, fontSize: 17 }}>
                {msg.title}
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontSize: 13 }}>
                提交人：{msg.sender} | {msg.date} {msg.time}
            </Text>

            {msg.approvalForm && (
                <div style={{ background: '#fafafa', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 14 }}>
                        审批单信息
                    </Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex' }}>
                            <Text type="secondary" style={{ width: 72, fontSize: 13, flexShrink: 0 }}>工单编号</Text>
                            <Text strong style={{ fontSize: 13 }}>{msg.approvalCode}</Text>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <Text type="secondary" style={{ width: 72, fontSize: 13, flexShrink: 0 }}>设备名称</Text>
                            <Text style={{ fontSize: 13 }}>{msg.approvalForm.equipmentName}</Text>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <Text type="secondary" style={{ width: 72, fontSize: 13, flexShrink: 0 }}>故障描述</Text>
                            <Text style={{ fontSize: 13 }}>{msg.approvalForm.faultDesc}</Text>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <Text type="secondary" style={{ width: 72, fontSize: 13, flexShrink: 0 }}>维修类型</Text>
                            <Text style={{ fontSize: 13 }}>{msg.approvalForm.repairType}</Text>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <Text type="secondary" style={{ width: 72, fontSize: 13, flexShrink: 0 }}>预计费用</Text>
                            <Text strong style={{ fontSize: 13, color: THEME.danger }}>{msg.approvalForm.estimatedCost}</Text>
                        </div>
                    </div>
                </div>
            )}

            {msg.approvalTimeline && (
                <div style={{ background: '#fafafa', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 14 }}>
                        审批流程
                    </Text>
                    <Timeline
                        items={msg.approvalTimeline.map((step) => ({
                            color: step.status === 'completed' ? 'green' : step.status === 'current' ? 'orange' : 'gray',
                            dot: step.status === 'current' ? <ClockCircleOutlined /> : undefined,
                            children: (
                                <div>
                                    <Text strong={step.status === 'current'} style={{ fontSize: 13 }}>
                                        {step.title}
                                    </Text>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {step.person} · {step.time}
                                        </Text>
                                    </div>
                                </div>
                            ),
                        }))}
                    />
                </div>
            )}

            <div style={{ background: '#fafafa', borderRadius: 8, padding: 14 }}>
                <Text strong style={{ display: 'block', marginBottom: 10, fontSize: 14 }}>
                    审批意见
                </Text>
                <TextArea
                    rows={3}
                    placeholder="请输入审批意见..."
                    value={approvalOpinion}
                    onChange={(e) => setApprovalOpinion(e.target.value)}
                    style={{ marginBottom: 12, fontSize: 14 }}
                />
            </div>
        </div>
    );

    // ============ 报警详情 ============

    const renderAlarmDetail = (msg: MessageItem) => (
        <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                <Tag color={TYPE_MAP[msg.type].color}>{TYPE_MAP[msg.type].label}</Tag>
                <Tag color={SPECIALTY_MAP[msg.specialty].color}>{SPECIALTY_MAP[msg.specialty].label}</Tag>
                {msg.priority === 'urgent' && <Tag color="red">紧急</Tag>}
            </div>
            <Title level={4} style={{ marginBottom: 6, fontSize: 17 }}>
                {msg.title}
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontSize: 13 }}>
                报警来源：{msg.sender} | {msg.date} {msg.time}
            </Text>

            {msg.alarmInfo && (
                <div style={{ background: THEME.primaryLight, borderRadius: 8, padding: 14, marginBottom: 16, border: `1px solid #ffccc7` }}>
                    <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 14, color: THEME.danger }}>
                        报警信息
                    </Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex' }}>
                            <Text type="secondary" style={{ width: 72, fontSize: 13, flexShrink: 0 }}>设备名称</Text>
                            <Text strong style={{ fontSize: 13 }}>{msg.alarmInfo.deviceName}</Text>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <Text type="secondary" style={{ width: 72, fontSize: 13, flexShrink: 0 }}>报警编号</Text>
                            <Text style={{ fontSize: 13 }}>{msg.alarmInfo.alarmCode}</Text>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <Text type="secondary" style={{ width: 72, fontSize: 13, flexShrink: 0 }}>报警等级</Text>
                            <Text strong style={{ fontSize: 13, color: msg.alarmInfo.alarmLevel === '紧急' ? THEME.danger : THEME.warning }}>
                                {msg.alarmInfo.alarmLevel}
                            </Text>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <Text type="secondary" style={{ width: 72, fontSize: 13, flexShrink: 0 }}>报警值</Text>
                            <Text strong style={{ fontSize: 13, color: THEME.danger }}>{msg.alarmInfo.alarmValue}</Text>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <Text type="secondary" style={{ width: 72, fontSize: 13, flexShrink: 0 }}>阈值</Text>
                            <Text style={{ fontSize: 13 }}>{msg.alarmInfo.threshold}</Text>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <Text type="secondary" style={{ width: 72, fontSize: 13, flexShrink: 0 }}>报警位置</Text>
                            <Text style={{ fontSize: 13 }}>{msg.alarmInfo.location}</Text>
                        </div>
                    </div>
                </div>
            )}

            {msg.content && (
                <div style={{ background: '#fafafa', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
                        报警详情
                    </Text>
                    <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', fontSize: 13 }}>
                        {msg.content}
                    </div>
                </div>
            )}

            <div style={{ background: '#fafafa', borderRadius: 8, padding: 14 }}>
                <Text strong style={{ display: 'block', marginBottom: 10, fontSize: 14 }}>
                    处理措施
                </Text>
            </div>
        </div>
    );

    // ============ 抽屉标题 ============

    const getDrawerTitle = () => {
        if (!selectedMessage) return '';
        if (selectedMessage.type === 'approval') return '审批单详情';
        if (selectedMessage.type === 'alarm') return '报警详情';
        if (selectedMessage.type === 'system') return '系统通知';
        return '通知详情';
    };

    // ============ 抽屉底部操作栏 ============

    const renderDrawerFooter = () => {
        if (!selectedMessage) return null;

        if (selectedMessage.type === 'approval') {
            return (
                <div style={{ display: 'flex', gap: 8, padding: '12px 0' }}>
                    <Button
                        danger
                        block
                        onClick={() => handleApprove('reject')}
                        style={{ fontSize: 15, height: 44, borderRadius: 8 }}
                    >
                        退回
                    </Button>
                    <Button
                        block
                        onClick={() => handleApprove('transfer')}
                        style={{ fontSize: 15, height: 44, borderRadius: 8 }}
                    >
                        转交
                    </Button>
                    <Button
                        type="primary"
                        block
                        onClick={() => handleApprove('approve')}
                        style={{
                            fontSize: 15,
                            height: 44,
                            borderRadius: 8,
                            background: THEME.primary,
                            borderColor: THEME.primary,
                        }}
                    >
                        通过
                    </Button>
                </div>
            );
        }

        if (selectedMessage.type === 'alarm') {
            return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '12px 0' }}>
                    <Button
                        type="primary"
                        block
                        icon={<ToolOutlined />}
                        onClick={() => handleAlarmAction('repair')}
                        style={{
                            fontSize: 14,
                            height: 44,
                            borderRadius: 8,
                            background: THEME.primary,
                            borderColor: THEME.primary,
                        }}
                    >
                        发起检维修
                    </Button>
                    <Button
                        block
                        icon={<ClockCircleOutlined />}
                        onClick={() => handleAlarmAction('postpone')}
                        style={{ fontSize: 14, height: 44, borderRadius: 8 }}
                    >
                        暂不处理
                    </Button>
                    <Button
                        block
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleAlarmAction('done')}
                        style={{ fontSize: 14, height: 44, borderRadius: 8, color: THEME.success, borderColor: THEME.success }}
                    >
                        已处理完毕
                    </Button>
                    <Button
                        block
                        icon={<ExclamationCircleOutlined />}
                        onClick={() => handleAlarmAction('ignore')}
                        style={{ fontSize: 14, height: 44, borderRadius: 8, color: THEME.textSecondary, borderColor: THEME.border }}
                    >
                        无需处理
                    </Button>
                </div>
            );
        }

        return null;
    };

    // ============ 渲染 ============

    return (
        <div className="mc-mobile-preview">
            <div className="mc-mobile-shell">
                {/* 顶部导航栏 */}
                <div className="mc-mobile-header">
                    <div className="mc-mobile-header-inner">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ArrowLeftOutlined style={{ fontSize: 18, color: '#fff' }} />
                            <span style={{ fontSize: 17, fontWeight: 600, color: '#fff' }}>消息中心</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Button
                                type="text"
                                icon={<CheckOutlined style={{ color: '#fff', fontSize: 14 }} />}
                                onClick={handleMarkAllRead}
                                size="small"
                                style={{ color: '#fff', fontSize: 13, padding: '0 6px', height: 28 }}
                            >
                                全部已读
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 搜索栏（可展开） */}
                {searchBarOpen && (
                    <div style={{ padding: '8px 16px', background: '#fff', borderBottom: `1px solid ${THEME.border}` }}>
                        <Input
                            placeholder="搜索消息标题、内容"
                            prefix={<SearchOutlined style={{ color: THEME.textSecondary }} />}
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            allowClear
                            autoFocus
                            style={{ borderRadius: 8, fontSize: 14 }}
                            onBlur={() => {
                                if (!searchKeyword.trim()) setSearchBarOpen(false);
                            }}
                        />
                    </div>
                )}

                {/* Tab 栏 */}
                <div className="mc-mobile-tabs">
                    {TAB_LIST.map((tab) => {
                        const isActive = activeTab === tab.key;
                        const count = unreadCounts[tab.key as keyof typeof unreadCounts] || 0;
                        return (
                            <div
                                key={tab.key}
                                className={`mc-mobile-tab ${isActive ? 'mc-mobile-tab-active' : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                <span style={{ position: 'relative' }}>
                                    {tab.label}
                                    {isToday && count > 0 && (
                                        <Badge
                                            count={count}
                                            size="small"
                                            style={{
                                                marginLeft: 2,
                                                backgroundColor: THEME.danger,
                                            }}
                                        />
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* 筛选工具条 */}
                <div className="mc-mobile-toolbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, overflow: 'hidden' }}>
                        <DatePicker
                            value={selectedDate}
                            onChange={(date) => setSelectedDate(date || dayjs())}
                            allowClear={false}
                            size="small"
                            style={{ width: 120, fontSize: 13, flexShrink: 0 }}
                        />
                        <div
                            onClick={() => setUnreadOnly(!unreadOnly)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 10px',
                                borderRadius: 16,
                                border: `1px solid ${unreadOnly ? THEME.primary : THEME.border}`,
                                background: unreadOnly ? THEME.primaryLight : '#fff',
                                color: unreadOnly ? THEME.primary : THEME.textSecondary,
                                fontSize: 13,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                            }}
                        >
                            <MailOutlined />
                            <span>未读</span>
                        </div>
                        <div
                            onClick={() => setUrgentOnly(!urgentOnly)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 10px',
                                borderRadius: 16,
                                border: `1px solid ${urgentOnly ? THEME.primary : THEME.border}`,
                                background: urgentOnly ? THEME.primaryLight : '#fff',
                                color: urgentOnly ? THEME.primary : THEME.textSecondary,
                                fontSize: 13,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                            }}
                        >
                            <ExclamationCircleOutlined />
                            <span>紧急</span>
                        </div>
                        <div
                            onClick={() => setFilterPopupOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 10px',
                                borderRadius: 16,
                                border: `1px solid ${specialtyFilter !== 'all' ? THEME.primary : THEME.border}`,
                                background: specialtyFilter !== 'all' ? THEME.primaryLight : '#fff',
                                color: specialtyFilter !== 'all' ? THEME.primary : THEME.textSecondary,
                                fontSize: 13,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                            }}
                        >
                            <FilterOutlined />
                            <span>筛选{specialtyFilter !== 'all' ? `(1)` : ''}</span>
                        </div>
                    </div>
                    <Button
                        type="text"
                        size="small"
                        icon={<SearchOutlined style={{ fontSize: 16 }} />}
                        onClick={() => setSearchBarOpen(true)}
                    />
                </div>

                {/* 消息列表 */}
                <div className="mc-mobile-body">
                    {filteredMessages.length === 0 ? (
                        <Empty description="暂无消息" style={{ padding: 60 }} />
                    ) : (
                        <>
                            {urgentMessages.length > 0 && (
                                <div>
                                    <div className="mc-mobile-section-header">
                                        <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                                        紧急
                                    </div>
                                    {urgentMessages.map(renderMessageCard)}
                                </div>
                            )}
                            {normalMessages.map(renderMessageCard)}
                        </>
                    )}
                </div>

                {/* 详情抽屉 - 移动端全屏 */}
                <Drawer
                    title={null}
                    open={drawerOpen}
                    onClose={handleCloseDrawer}
                    placement="bottom"
                    height="100%"
                    closable={false}
                    styles={{
                        body: { padding: 0 },
                    }}
                >
                    {selectedMessage && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            {/* 抽屉顶部栏 */}
                            <div className="mc-mobile-drawer-header">
                                <Button
                                    type="text"
                                    icon={<ArrowLeftOutlined style={{ fontSize: 18 }} />}
                                    onClick={handleCloseDrawer}
                                    style={{ padding: 0 }}
                                />
                                <Text strong style={{ fontSize: 16 }}>{getDrawerTitle()}</Text>
                                <div style={{ width: 32 }} />
                            </div>

                            {/* 抽屉内容区 */}
                            <div className="mc-mobile-drawer-body">
                                {selectedMessage.type === 'approval'
                                    ? renderApprovalDetail(selectedMessage)
                                    : selectedMessage.type === 'alarm'
                                      ? renderAlarmDetail(selectedMessage)
                                      : renderNotificationDetail(selectedMessage)}
                            </div>

                            {/* 抽屉底部操作栏 */}
                            {renderDrawerFooter() && (
                                <div className="mc-mobile-drawer-footer">
                                    {renderDrawerFooter()}
                                </div>
                            )}
                        </div>
                    )}
                </Drawer>

                {/* 筛选弹出层 */}
                <Drawer
                    title={null}
                    open={filterPopupOpen}
                    onClose={() => setFilterPopupOpen(false)}
                    placement="bottom"
                    height="auto"
                    closable={false}
                    styles={{
                        body: {
                            borderTopLeftRadius: 12,
                            borderTopRightRadius: 12,
                            padding: '20px 16px 24px',
                        },
                    }}
                >
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong style={{ fontSize: 16 }}>筛选条件</Text>
                        <Button type="text" icon={<CloseOutlined />} onClick={() => setFilterPopupOpen(false)} />
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <Text style={{ display: 'block', marginBottom: 10, fontSize: 14, color: THEME.textSecondary }}>
                            专业类型
                        </Text>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {[
                                { value: 'all', label: '全部' },
                                { value: 'equipment', label: '设备' },
                                { value: 'production', label: '生产' },
                                { value: 'quality', label: '质量' },
                            ].map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={() => setSpecialtyFilter(opt.value)}
                                    style={{
                                        padding: '6px 16px',
                                        borderRadius: 20,
                                        fontSize: 14,
                                        border: `1px solid ${specialtyFilter === opt.value ? THEME.primary : THEME.border}`,
                                        background: specialtyFilter === opt.value ? THEME.primaryLight : '#fff',
                                        color: specialtyFilter === opt.value ? THEME.primary : THEME.textPrimary,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <Button
                            block
                            onClick={() => {
                                setSpecialtyFilter('all');
                            }}
                            style={{ height: 44, borderRadius: 8, fontSize: 15 }}
                        >
                            重置
                        </Button>
                        <Button
                            type="primary"
                            block
                            onClick={() => setFilterPopupOpen(false)}
                            style={{
                                height: 44,
                                borderRadius: 8,
                                fontSize: 15,
                                background: THEME.primary,
                                borderColor: THEME.primary,
                            }}
                        >
                            确认
                        </Button>
                    </div>
                </Drawer>
            </div>
        </div>
    );
}
