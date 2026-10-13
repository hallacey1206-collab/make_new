import React, { useMemo, useState } from 'react';
import {
    BellOutlined,
    CheckOutlined,
    ClockCircleOutlined,
    CloseOutlined,
    FileTextOutlined,
    MailOutlined,
    SearchOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import {
    Badge,
    Button,
    Card,
    DatePicker,
    Drawer,
    Empty,
    Input,
    Select,
    Space,
    Switch,
    Tabs,
    Tag,
    Timeline,
    Typography,
    message,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { TextArea } = Input;

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
    source: string;
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

const SPECIALTY_MAP: Record<SpecialtyType, { label: string; color: string }> = {
    equipment: { label: '设备', color: 'blue' },
    production: { label: '生产', color: 'green' },
    quality: { label: '质量', color: 'purple' },
};

const TYPE_MAP: Record<MessageType, { label: string; color: string; icon: React.ReactNode }> = {
    notification: { label: '通知', color: 'blue', icon: <MailOutlined /> },
    approval: { label: '审批', color: 'orange', icon: <FileTextOutlined /> },
    alarm: { label: '待办', color: 'red', icon: <BellOutlined /> },
    system: { label: '系统', color: 'default', icon: <SettingOutlined /> },
};

// 模拟消息数据
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
        source: '报警中心',
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
        source: '维修工单',
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
        source: '设备管理',
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
        source: '生产调度',
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
        source: '质量管理',
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
        source: '系统管理',
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
        source: '报警中心',
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
        source: '报警中心',
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

type TabKey = 'all' | 'notification' | 'approval' | 'alarm' | 'system';

const TAB_LIST = [
    { key: 'all' as TabKey, label: '全部' },
    { key: 'notification' as TabKey, label: '通知类' },
    { key: 'approval' as TabKey, label: '审批类' },
    { key: 'alarm' as TabKey, label: '待办类' },
    { key: 'system' as TabKey, label: '系统类' },
];

export default function MessageCenterApp() {
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
    const [handledIds, setHandledIds] = useState<Set<string>>(new Set());

    const todayStr = dayjs().format('YYYY-MM-DD');
    const isToday = selectedDate.format('YYYY-MM-DD') === todayStr;

    const unreadCounts = useMemo(() => {
        const dateStr = selectedDate.format('YYYY-MM-DD');
        const dayMessages = messages.filter((m) => m.date === dateStr);
        return {
            all: dayMessages.filter((m) => m.status === 'unread').length,
            notification: dayMessages.filter((m) => m.type === 'notification' && m.status === 'unread').length,
            approval: dayMessages.filter((m) => m.type === 'approval' && m.status === 'unread').length,
            system: dayMessages.filter((m) => m.type === 'system' && m.status === 'unread').length,
        };
    }, [messages, selectedDate]);

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

    const handleMarkAllRead = () => {
        const dateStr = selectedDate.format('YYYY-MM-DD');
        setMessages((prev) =>
            prev.map((m) => (m.date === dateStr && m.status === 'unread' ? { ...m, status: 'read' as const } : m))
        );
        message.success('已将当天全部消息标记为已读');
    };

    const handleMarkRead = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
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

    const renderMessageCard = (msg: MessageItem) => {
        const isUnread = msg.status === 'unread';
        const isUrgent = msg.priority === 'urgent';
        const typeInfo = TYPE_MAP[msg.type];
        const specialtyInfo = SPECIALTY_MAP[msg.specialty];

        return (
            <div
                key={msg.id}
                className="mc-message-card"
                onClick={() => handleOpenDetail(msg)}
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '16px 20px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    background: isUrgent ? '#fff2f0' : isUnread ? '#fff' : '#fafafa',
                    opacity: isUnread ? 1 : 0.75,
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = isUrgent ? '#fff1f0' : '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = isUrgent ? '#fff2f0' : isUnread ? '#fff' : '#fafafa';
                }}
            >
                {isUnread && (
                    <div
                        style={{
                            width: 10,
                            height: 10,
                            minWidth: 10,
                            borderRadius: '50%',
                            background: '#ff4d4f',
                            marginRight: 12,
                            marginTop: 4,
                            flexShrink: 0,
                        }}
                    />
                )}
                <div
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: isUrgent ? '#ff4d4f' : typeInfo.color === 'blue' ? '#e6f4ff' : typeInfo.color === 'orange' ? '#fff7e6' : '#f5f5f5',
                        color: isUrgent ? '#fff' : typeInfo.color === 'blue' ? '#1677ff' : typeInfo.color === 'orange' ? '#fa8c16' : '#8c8c8c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        marginRight: 16,
                        flexShrink: 0,
                    }}
                >
                    {typeInfo.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text
                            strong={isUnread}
                            style={{
                                fontSize: 15,
                                color: isUnread ? '#262626' : '#8c8c8c',
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
                            fontSize: 13,
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginBottom: 8,
                        }}
                    >
                        {msg.summary}
                    </Text>
                    <Space size={8} wrap>
                        <Tag color={specialtyInfo.color}>
                            {specialtyInfo.label}
                        </Tag>
                        <Tag color={typeInfo.color}>
                            {msg.source}
                        </Tag>
                        {isUrgent && (
                            <Tag color="red">
                                紧急
                            </Tag>
                        )}
                    </Space>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right', marginLeft: 16 }}>
                    <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                        {isToday ? msg.time : msg.date}
                    </Text>
                    <Space size={8}>
                        {isUnread && (
                            <Button
                                size="small"
                                type="text"
                                style={{ fontSize: 12, color: '#8c8c8c' }}
                                onClick={(e) => handleMarkRead(msg.id, e)}
                            >
                                标记已读
                            </Button>
                        )}
                        {!handledIds.has(msg.id) && (
                            msg.type === 'approval' ? (
                                <Button
                                    size="small"
                                    type="primary"
                                    style={{ fontSize: 12 }}
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
                                    style={{ fontSize: 12 }}
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
                                    style={{ fontSize: 12 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDetail(msg);
                                    }}
                                >
                                    查看详情
                                    </Button>
                            )
                        )}
                    </Space>
                </div>
            </div>
        );
    };

    const renderNotificationDetail = (msg: MessageItem) => (
        <div data-annotation-id="mc-detail-notification">
            <div style={{ marginBottom: 16 }}>
                <Space size={8}>
                    <Tag color={TYPE_MAP[msg.type].color}>{TYPE_MAP[msg.type].label}</Tag>
                    <Tag color={SPECIALTY_MAP[msg.specialty].color}>{SPECIALTY_MAP[msg.specialty].label}</Tag>
                    {msg.priority === 'urgent' && <Tag color="red">紧急</Tag>}
                </Space>
            </div>
            <Title level={4} style={{ marginBottom: 8 }}>
                {msg.title}
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                {msg.sender} · {msg.date} {msg.time}
            </Text>
            <div
                style={{
                    padding: 16,
                    background: '#f6ffed',
                    borderRadius: 8,
                    border: '1px solid #b7eb8f',
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                }}
            >
                {msg.content}
            </div>
            {msg.attachments && msg.attachments.length > 0 && (
                <div style={{ marginTop: 24 }}>
                    <Text strong style={{ display: 'block', marginBottom: 12 }}>
                        附件
                    </Text>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        {msg.attachments.map((att) => (
                            <Card
                                key={att.name}
                                size="small"
                                style={{ cursor: 'pointer' }}
                                styles={{ body: { padding: '8px 12px' } }}
                            >
                                <FileTextOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                                {att.name} <Text type="secondary">({att.size})</Text>
                            </Card>
                        ))}
                    </Space>
                </div>
            )}
        </div>
    );

    const renderApprovalDetail = (msg: MessageItem) => (
        <div data-annotation-id="mc-detail-approval">
            <div style={{ marginBottom: 16 }}>
                <Space size={8}>
                    <Tag color={TYPE_MAP[msg.type].color}>{TYPE_MAP[msg.type].label}</Tag>
                    <Tag color={SPECIALTY_MAP[msg.specialty].color}>{SPECIALTY_MAP[msg.specialty].label}</Tag>
                </Space>
            </div>
            <Title level={4} style={{ marginBottom: 8 }}>
                {msg.title}
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                提交人：{msg.sender} | 提交时间：{msg.date} {msg.time}
            </Text>

            {msg.approvalForm && (
                <Card size="small" title="审批单信息" style={{ marginBottom: 24 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 12, columnGap: 16 }}>
                        <Text type="secondary">工单编号</Text>
                        <Text strong>{msg.approvalCode}</Text>

                        <Text type="secondary">设备名称</Text>
                        <Text>{msg.approvalForm.equipmentName}</Text>

                        <Text type="secondary">故障描述</Text>
                        <Text>{msg.approvalForm.faultDesc}</Text>

                        <Text type="secondary">维修类型</Text>
                        <Text>{msg.approvalForm.repairType}</Text>

                        <Text type="secondary">预计费用</Text>
                        <Text strong style={{ color: '#ff4d4f' }}>
                            {msg.approvalForm.estimatedCost}
                        </Text>
                    </div>
                </Card>
            )}

            {msg.approvalTimeline && (
                <Card size="small" title="审批流程" style={{ marginBottom: 24 }}>
                    <Timeline
                        items={msg.approvalTimeline.map((step) => ({
                            color:
                                step.status === 'completed'
                                    ? 'green'
                                    : step.status === 'current'
                                      ? 'orange'
                                      : 'gray',
                            dot: step.status === 'current' ? <ClockCircleOutlined /> : undefined,
                            children: (
                                <div>
                                    <Text strong={step.status === 'current'}>
                                        {step.title}
                                    </Text>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 13 }}>
                                            {step.person} · {step.time}
                                        </Text>
                                    </div>
                                </div>
                            ),
                        }))}
                    />
                </Card>
            )}

            <Card size="small" title="审批意见">
                <TextArea
                    rows={4}
                    placeholder="请输入审批意见..."
                    value={approvalOpinion}
                    onChange={(e) => setApprovalOpinion(e.target.value)}
                    style={{ marginBottom: 16 }}
                />
                <Space>
                    <Button danger onClick={() => handleApprove('reject')}>
                        退回
                    </Button>
                    <Button onClick={() => handleApprove('transfer')}>转交</Button>
                    <Button type="primary" onClick={() => handleApprove('approve')}>
                        通过
                    </Button>
                </Space>
            </Card>
        </div>
    );

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

    const renderAlarmDetail = (msg: MessageItem) => (
        <div data-annotation-id="mc-detail-alarm">
            <div style={{ marginBottom: 16 }}>
                <Space size={8}>
                    <Tag color={TYPE_MAP[msg.type].color}>{TYPE_MAP[msg.type].label}</Tag>
                    <Tag color={SPECIALTY_MAP[msg.specialty].color}>{SPECIALTY_MAP[msg.specialty].label}</Tag>
                    {msg.priority === 'urgent' && <Tag color="red">紧急</Tag>}
                </Space>
            </div>
            <Title level={4} style={{ marginBottom: 8 }}>
                {msg.title}
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                报警来源：{msg.sender} | 报警时间：{msg.date} {msg.time}
            </Text>

            {msg.alarmInfo && (
                <Card size="small" title="报警信息" style={{ marginBottom: 24 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 12, columnGap: 16 }}>
                        <Text type="secondary">设备名称</Text>
                        <Text strong>{msg.alarmInfo.deviceName}</Text>

                        <Text type="secondary">报警编号</Text>
                        <Text>{msg.alarmInfo.alarmCode}</Text>

                        <Text type="secondary">报警等级</Text>
                        <Text strong style={{ color: msg.alarmInfo.alarmLevel === '紧急' ? '#ff4d4f' : '#fa8c16' }}>
                            {msg.alarmInfo.alarmLevel}
                        </Text>

                        <Text type="secondary">报警值</Text>
                        <Text strong style={{ color: '#ff4d4f' }}>{msg.alarmInfo.alarmValue}</Text>

                        <Text type="secondary">阈值</Text>
                        <Text>{msg.alarmInfo.threshold}</Text>

                        <Text type="secondary">报警位置</Text>
                        <Text>{msg.alarmInfo.location}</Text>
                    </div>
                </Card>
            )}

            {msg.content && (
                <Card size="small" title="报警详情" style={{ marginBottom: 24 }}>
                    <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                    </div>
                </Card>
            )}

            <Card size="small" title="处理措施">
                <Space wrap>
                    <Button type="primary" onClick={() => handleAlarmAction('repair')}>
                        发起检维修
                    </Button>
                    <Button onClick={() => handleAlarmAction('postpone')}>
                        暂不处理
                    </Button>
                    <Button onClick={() => handleAlarmAction('done')}>
                        已处理完毕
                    </Button>
                    <Button onClick={() => handleAlarmAction('ignore')}>
                        无需处理
                    </Button>
                </Space>
            </Card>
        </div>
    );

    return (
        <div style={{ padding: 24 }}>
            {/* 顶部标题栏 */}
            <div
                data-annotation-id="mc-title-bar"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                }}
            >
                <Title level={3} style={{ margin: 0 }}>
                    消息中心
                </Title>
                <Space>
                    <Button icon={<CheckOutlined />} onClick={handleMarkAllRead}>
                        全部已读
                    </Button>
                    <Button type="text" icon={<SettingOutlined />} />
                </Space>
            </div>

            {/* Tab 栏 */}
            <div data-annotation-id="mc-tabs" style={{ marginBottom: 16 }}>
            <Tabs
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key as TabKey)}
                items={TAB_LIST.map((tab) => ({
                    key: tab.key,
                    label: (
                        <span>
                            {tab.label}
                            {isToday && unreadCounts[tab.key] > 0 && (
                                <Badge
                                    count={unreadCounts[tab.key]}
                                    style={{ marginLeft: 6, backgroundColor: '#ff4d4f' }}
                                    size="small"
                                />
                            )}
                        </span>
                    ),
                }))}
            />
            </div>

            {/* 筛选工具条 */}
            <div data-annotation-id="mc-toolbar">
            <Card size="small" style={{ marginBottom: 16 }} styles={{ body: { padding: '12px 16px' } }}>
                <Space size={16} wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space size={16} wrap>
                        <Space>
                            <span style={{ color: '#595959' }}>日期：</span>
                            <DatePicker
                                value={selectedDate}
                                onChange={(date) => setSelectedDate(date || dayjs())}
                                allowClear={false}
                                style={{ width: 140 }}
                            />
                        </Space>
                        <Space>
                            <span style={{ color: '#595959' }}>专业类型：</span>
                            <Select
                                value={specialtyFilter}
                                onChange={setSpecialtyFilter}
                                style={{ width: 120 }}
                                options={[
                                    { value: 'all', label: '全部' },
                                    { value: 'equipment', label: '设备' },
                                    { value: 'production', label: '生产' },
                                    { value: 'quality', label: '质量' },
                                ]}
                            />
                        </Space>
                        <Space>
                            <span style={{ color: '#595959' }}>仅看未读</span>
                            <Switch checked={unreadOnly} onChange={setUnreadOnly} />
                        </Space>
                        <Space>
                            <span style={{ color: '#595959' }}>仅看紧急</span>
                            <Switch checked={urgentOnly} onChange={setUrgentOnly} />
                        </Space>
                    </Space>
                    <Input
                        placeholder="搜索消息"
                        prefix={<SearchOutlined />}
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        style={{ width: 240 }}
                        allowClear
                    />
                </Space>
            </Card>
            </div>

            {/* 消息列表 */}
            <Card data-annotation-id="mc-list" styles={{ body: { padding: 0 } }}>
                {filteredMessages.length === 0 ? (
                    <Empty description="暂无消息" style={{ padding: 40 }} />
                ) : (
                    <>
                        {urgentMessages.length > 0 && (
                            <div
                                style={{
                                    background: '#fff2f0',
                                    borderBottom: '1px solid #ffccc7',
                                }}
                            >
                                <div
                                    style={{
                                        padding: '8px 20px',
                                        fontSize: 13,
                                        color: '#ff4d4f',
                                        fontWeight: 600,
                                        borderBottom: '1px solid #ffccc7',
                                    }}
                                >
                                    紧急
                                </div>
                                {urgentMessages.map(renderMessageCard)}
                            </div>
                        )}
                        {normalMessages.map(renderMessageCard)}
                    </>
                )}
            </Card>

            {/* 详情抽屉 */}
            <Drawer
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{selectedMessage?.type === 'approval' ? '审批单详情' : '通知详情'}</span>
                        <Button type="text" icon={<CloseOutlined />} onClick={handleCloseDrawer} />
                    </div>
                }
                open={drawerOpen}
                onClose={handleCloseDrawer}
                width={640}
                closable={false}
                styles={{ body: { padding: '24px 24px 40px' } }}
            >
                {selectedMessage &&
                    (selectedMessage.type === 'approval'
                        ? renderApprovalDetail(selectedMessage)
                        : selectedMessage.type === 'alarm'
                          ? renderAlarmDetail(selectedMessage)
                          : renderNotificationDetail(selectedMessage))}
            </Drawer>
        </div>
    );
}
