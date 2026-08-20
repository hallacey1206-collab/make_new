import React, { useState, useRef, useEffect } from 'react';
import {
    CloseOutlined,
    ExpandOutlined,
    CompressOutlined,
    PaperClipOutlined,
    SendOutlined,
    ThunderboltOutlined,
    MonitorOutlined,
    MedicineBoxOutlined,
    FileTextOutlined,
    BarChartOutlined,
    PlusOutlined,
    SearchOutlined,
    MoreOutlined,
    EditOutlined,
    PushpinOutlined,
    InboxOutlined,
    DeleteOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    CloseCircleFilled,
} from '@ant-design/icons';
import robotIcon from './assets/robot-icon.png';

const QUICK_CARDS = [
    {
        key: 'status-monitor',
        icon: <MonitorOutlined />,
        title: '状态监测',
        desc: '智慧凝练，洞察每一刻的风险',
        color: '#7C3AED',
        presetText: '帮我分析当前所有设备的报警状态，并且按照报警等级列出需要重点关注的设备清单。',
    },
    {
        key: 'fault-diagnosis',
        icon: <MedicineBoxOutlined />,
        title: '故障诊断',
        desc: '我们帮你透过现象看本质',
        color: '#7C3AED',
        presetText: '你是一个资深的设备诊断专家，帮我针对最近7天报警的设备做故障诊断，输出诊断报告。报告中包含：设备基本信息、报警信息、诊断信息以及特征图谱。',
    },
    {
        key: 'operation-report',
        icon: <FileTextOutlined />,
        title: '运行报告',
        desc: '数据驱动，让每一个数字说话',
        color: '#7C3AED',
        presetText: '帮我使用可视化图表分析当前所有设备的运行状态及运转率。',
    },
    {
        key: 'statistics-report',
        icon: <BarChartOutlined />,
        title: '统计报表',
        desc: '数据驱动，让每一个数字说话',
        color: '#7C3AED',
        presetText: '帮我统计最近一个月的设备异常，从设备类型、报警等级、部件、设备排行四个维度分析，结果使用可视化图表给我。',
    },
];

type TaskStatus = 'completed' | 'cancelled' | 'active';

interface TaskItem {
    id: string;
    title: string;
    status: TaskStatus;
}

interface TaskGroup {
    label: string;
    tasks: TaskItem[];
}

const TASK_GROUPS: TaskGroup[] = [
    {
        label: '今天',
        tasks: [
            { id: 't1', title: '智能助手UI设计', status: 'completed' },
        ],
    },
    {
        label: '昨天',
        tasks: [
            { id: 't2', title: '消息中心页面设计', status: 'active' },
            { id: 't3', title: '数字化管理平台', status: 'completed' },
            { id: 't4', title: 'IPOM平台系统管理', status: 'cancelled' },
        ],
    },
    {
        label: '更早',
        tasks: [
            { id: 't5', title: '出入库数据可视化分析', status: 'completed' },
            { id: 't6', title: '院士汇报PPT', status: 'completed' },
            { id: 't7', title: 'PPTX技能介绍', status: 'completed' },
        ],
    },
];

const STATUS_MAP: Record<TaskStatus, { label: string; color: string }> = {
    completed: { label: '已完成', color: '#10B981' },
    cancelled: { label: '已取消', color: '#EF4444' },
    active: { label: '进行中', color: '#6B7280' },
};

const MORE_MENU_ITEMS = [
    { key: 'rename', icon: <EditOutlined />, label: '重命名' },
    { key: 'pin', icon: <PushpinOutlined />, label: '置顶' },
    { key: 'archive', icon: <InboxOutlined />, label: '归档' },
    { key: 'delete', icon: <DeleteOutlined />, label: '删除' },
];

export default function SmartAssistantApp() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [deepThinking, setDeepThinking] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string>('t1');
    const [moreMenuTaskId, setMoreMenuTaskId] = useState<string | null>(null);
    const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
    const [attachments, setAttachments] = useState<{ name: string; size: string }[]>([]);
    const [selectedCardKey, setSelectedCardKey] = useState<string | null>(null);

    const menuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 输入框自动撑高，最多3行
    const autoGrowTextarea = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        const lineHeight = 21; // 14px * 1.5
        const maxHeight = lineHeight * 3;
        el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
    };

    useEffect(() => {
        autoGrowTextarea();
    }, [inputValue]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMoreMenuTaskId(null);
            }
        };
        if (moreMenuTaskId) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [moreMenuTaskId]);

    const handleOpenDialog = () => {
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setIsMaximized(false);
    };

    const handleToggleMaximize = () => {
        setIsMaximized((prev) => !prev);
    };

    const handleSend = () => {
        if (inputValue.trim()) {
            setInputValue('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + 'B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
        return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
    };

    const handleFileSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const newAttachments = Array.from(files).map((f) => ({
            name: f.name,
            size: formatFileSize(f.size),
        }));
        setAttachments((prev) => [...prev, ...newAttachments]);
    };

    const handleRemoveAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const files = e.clipboardData?.files;
        if (files && files.length > 0) {
            e.preventDefault();
            handleFileSelect(files);
        }
    };

    const handleMoreClick = (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const dialogRect = (e.currentTarget as HTMLElement).closest('.sa-dialog')?.getBoundingClientRect();
        if (dialogRect) {
            setMenuPos({
                top: rect.bottom - dialogRect.top + 4,
                right: dialogRect.right - rect.right + 12,
            });
        }
        setMoreMenuTaskId(moreMenuTaskId === taskId ? null : taskId);
    };

    const SIDEBAR_WIDTH = 260;

    // 对话框尺寸
    const dialogStyle: React.CSSProperties = isMaximized
        ? {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            transition: 'all 0.3s ease',
            className: 'sa-dialog',
        }
        : {
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '66.67vw',
            height: '25vh',
            minHeight: 280,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0f0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            transition: 'all 0.3s ease',
            overflow: 'hidden',
        };

    const renderSidebar = () => (
        <div style={{
            width: sidebarOpen ? SIDEBAR_WIDTH : 0,
            background: '#F8F9FA',
            borderRight: '1px solid #E5E7EB',
            flexShrink: 0,
            overflow: 'hidden',
            transition: 'width 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {sidebarOpen && (
                <div style={{
                    width: SIDEBAR_WIDTH,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    overflow: 'hidden',
                }}>
                    {/* 顶部功能导航 */}
                    <div style={{
                        padding: '16px 16px 12px',
                        borderBottom: '1px solid #E5E7EB',
                    }} data-annotation-id="sa-sidebar-nav">
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '10px 12px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                color: '#6B7280',
                                fontSize: 15,
                                fontWeight: 500,
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = '#E5E7EB';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                            }}
                        >
                            <PlusOutlined style={{ fontSize: 16 }} />
                            <span style={{ flex: 1 }}>新建任务</span>
                        </div>
                    </div>

                    {/* 任务列表 */}
                    <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px' }}>
                        {/* 搜索任务 - 在任务列表上方 */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 12px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                color: '#9CA3AF',
                                fontSize: 14,
                                transition: 'background 0.2s',
                                background: '#E5E7EB',
                                marginBottom: 8,
                            }}
                            data-annotation-id="sa-search-task"
                        >
                            <SearchOutlined style={{ fontSize: 14 }} />
                            <span>搜索任务</span>
                        </div>
                        {TASK_GROUPS.map((group) => (
                            <div key={group.label} style={{ marginBottom: 16 }}>
                                <div style={{
                                    fontSize: 13,
                                    color: '#9CA3AF',
                                    fontWeight: 500,
                                    padding: '8px 12px 6px',
                                }}>
                                    {group.label}
                                </div>
                                {group.tasks.map((task) => {
                                    const isSelected = selectedTaskId === task.id;
                                    const statusInfo = STATUS_MAP[task.status];
                                    return (
                                        <div
                                            key={task.id}
                                            onClick={() => {
                                                setSelectedTaskId(task.id);
                                                setMoreMenuTaskId(null);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '10px 12px',
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                                background: isSelected ? '#E5E7EB' : hoveredTaskId === task.id ? '#fff' : 'transparent',
                                                transition: 'background 0.15s',
                                                marginBottom: 2,
                                                position: 'relative',
                                            }}
                                            onMouseEnter={() => {
                                                setHoveredTaskId(task.id);
                                            }}
                                            onMouseLeave={() => {
                                                setHoveredTaskId(null);
                                            }}
                                        >
                                            <span style={{
                                                flex: 1,
                                                fontSize: 15,
                                                fontWeight: 500,
                                                color: '#1E293B',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                marginRight: 8,
                                            }}>
                                                {task.title}
                                            </span>
                                            {hoveredTaskId === task.id ? (
                                                <MoreOutlined
                                                    style={{ fontSize: 16, color: '#6B7280', flexShrink: 0 }}
                                                    onClick={(e) => handleMoreClick(task.id, e)}
                                                />
                                            ) : (
                                                <span style={{
                                                    fontSize: 13,
                                                    color: statusInfo.color,
                                                    whiteSpace: 'nowrap',
                                                    flexShrink: 0,
                                                }}>
                                                    {statusInfo.label}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#f0f2f5', position: 'relative' }}>
            {/* 模拟页面背景内容 */}
            <div style={{
                padding: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#bfbfbf',
                fontSize: 16,
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>&#128203;</div>
                    <div>点击右下角图标唤起智能助手</div>
                </div>
            </div>

            {/* 右下角浮动图标 */}
            {!dialogOpen && (
                <div
                    onClick={handleOpenDialog}
                    data-annotation-id="sa-float-icon"
                    style={{
                        position: 'fixed',
                        right: 32,
                        bottom: 32,
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: '#7C3AED',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        zIndex: 999,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 6px 24px rgba(124, 58, 237, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(124, 58, 237, 0.4)';
                    }}
                >
                    <img src={robotIcon} alt="智能助手" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                </div>
            )}

            {/* 对话框 */}
            {dialogOpen && (
                <div style={dialogStyle} className="sa-dialog" data-annotation-id="sa-dialog">
                    {/* 侧边栏 + 主内容区 */}
                    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                        {/* 历史任务侧边栏 */}
                        {renderSidebar()}

                        {/* 右侧主区域 */}
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                            {/* 顶部标题栏 */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 20px',
                                borderBottom: '1px solid #f0f0f0',
                                flexShrink: 0,
                            }} data-annotation-id="sa-title-bar">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {/* 侧边栏收起/展开按钮 */}
                                    <div
                                        onClick={() => setSidebarOpen((prev) => !prev)}
                                        style={{
                                            cursor: 'pointer',
                                            padding: 4,
                                            borderRadius: 4,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#8c8c8c',
                                            transition: 'color 0.2s, background 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLElement).style.color = '#262626';
                                            (e.currentTarget as HTMLElement).style.background = '#f5f5f5';
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLElement).style.color = '#8c8c8c';
                                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                                        }}
                                    >
                                        {sidebarOpen ? <MenuFoldOutlined style={{ fontSize: 16 }} /> : <MenuUnfoldOutlined style={{ fontSize: 16 }} />}
                                    </div>

                                    <CloseOutlined
                                        onClick={handleCloseDialog}
                                        style={{
                                            fontSize: 16,
                                            color: '#8c8c8c',
                                            cursor: 'pointer',
                                            padding: 4,
                                            borderRadius: 4,
                                            transition: 'color 0.2s, background 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLElement).style.color = '#262626';
                                            (e.currentTarget as HTMLElement).style.background = '#f5f5f5';
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLElement).style.color = '#8c8c8c';
                                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                                        }}
                                    />
                                    <span style={{
                                        fontSize: 16,
                                        fontWeight: 600,
                                        color: '#262626',
                                    }}>
                                        智能助手
                                    </span>
                                </div>
                                <div
                                    onClick={handleToggleMaximize}
                                    style={{
                                        cursor: 'pointer',
                                        padding: 6,
                                        borderRadius: 6,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = '#f5f5f5';
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    }}
                                >
                                    {isMaximized ? (
                                        <CompressOutlined style={{ fontSize: 16, color: '#595959' }} />
                                    ) : (
                                        <ExpandOutlined style={{ fontSize: 16, color: '#595959' }} />
                                    )}
                                </div>
                            </div>

                            {/* 消息内容区 */}
                            <div style={{
                                flex: 1,
                                overflow: 'auto',
                                padding: '20px 24px',
                            }}>
                                {/* 助手欢迎消息 */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }} data-annotation-id="sa-welcome-msg">
                                    <div style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '50%',
                                        background: '#7C3AED',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        overflow: 'hidden',
                                    }}>
                                        <img src={robotIcon} alt="AI" style={{ width: 28, height: 28 }} />
                                    </div>
                                    <div style={{
                                        background: '#f5f6fa',
                                        borderRadius: '12px 12px 12px 4px',
                                        padding: '12px 16px',
                                        maxWidth: '80%',
                                        color: '#333',
                                        fontSize: 14,
                                        lineHeight: 1.6,
                                    }}>
                                        您好！我是您的AI助手，请问您想让我做点什么呢？
                                    </div>
                                </div>

                                {/* 快捷功能卡片 */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: 12,
                                }} data-annotation-id="sa-quick-cards">
                                    {QUICK_CARDS.map((card) => (
                                        <div
                                            key={card.key}
                                            className="sa-quick-card"
                                            style={{
                                                background: selectedCardKey === card.key ? '#f3f0ff' : '#fff',
                                                border: `1px solid ${selectedCardKey === card.key ? '#7C3AED' : '#f0f0f0'}`,
                                                borderRadius: 10,
                                                padding: '10px 14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                boxShadow: selectedCardKey === card.key ? '0 2px 8px rgba(124, 58, 237, 0.15)' : 'none',
                                            }}
                                            onClick={() => {
                                                if (selectedCardKey === card.key) {
                                                    setSelectedCardKey(null);
                                                    setInputValue('');
                                                } else {
                                                    setSelectedCardKey(card.key);
                                                    setInputValue(card.presetText);
                                                }
                                            }}
                                        >
                                            <div style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: '50%',
                                                background: '#7C3AED',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                {React.cloneElement(card.icon, { style: { color: '#fff', fontSize: 14 } })}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    color: '#262626',
                                                    lineHeight: 1.4,
                                                }}>
                                                    {card.title}
                                                </div>
                                                <div style={{
                                                    fontSize: 12,
                                                    color: '#8c8c8c',
                                                    lineHeight: 1.4,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {card.desc}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 底部输入栏 */}
                            <div style={{
                                padding: '12px 20px',
                                borderTop: '1px solid #f0f0f0',
                                flexShrink: 0,
                            }} data-annotation-id="sa-input-bar">
                                {/* 附件回显区 */}
                                {attachments.length > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 8,
                                        marginBottom: 8,
                                    }}>
                                        {attachments.map((att, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    padding: '4px 10px',
                                                    borderRadius: 8,
                                                    background: '#f0f1f5',
                                                    fontSize: 13,
                                                    color: '#374151',
                                                    maxWidth: 240,
                                                }}
                                            >
                                                <FileTextOutlined style={{ fontSize: 14, color: '#7C3AED', flexShrink: 0 }} />
                                                <span style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {att.name}
                                                </span>
                                                <span style={{ color: '#9CA3AF', flexShrink: 0 }}>({att.size})</span>
                                                <CloseCircleFilled
                                                    style={{ fontSize: 14, color: '#9CA3AF', cursor: 'pointer', flexShrink: 0 }}
                                                    onClick={() => handleRemoveAttachment(idx)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* 隐藏的文件选择器 */}
                                <input
                                    type="file"
                                    multiple
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        handleFileSelect(e.target.files);
                                        e.target.value = '';
                                    }}
                                />

                                <div style={{
                                    background: '#f5f6fa',
                                    borderRadius: 16,
                                    padding: '10px 16px',
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    gap: 12,
                                }}>
                                    {/* 输入框 - 自适应高度，最多3行 */}
                                    <textarea
                                        ref={textareaRef}
                                        placeholder="请输入您的问题或需求"
                                        value={inputValue}
                                        onChange={(e) => {
                                            setInputValue(e.target.value);
                                            setSelectedCardKey(null);
                                        }}
                                        onKeyDown={handleKeyDown}
                                        onPaste={handlePaste}
                                        rows={1}
                                        style={{
                                            flex: 1,
                                            border: 'none',
                                            outline: 'none',
                                            background: 'transparent',
                                            fontSize: 14,
                                            color: '#262626',
                                            resize: 'none',
                                            lineHeight: '1.5',
                                            height: 21,
                                            maxHeight: 63,
                                            overflowY: 'auto',
                                            padding: 0,
                                        }}
                                    />

                                    {/* 附件按钮 - 移至输入框右侧 */}
                                    <PaperClipOutlined
                                        style={{ fontSize: 18, color: '#262626', cursor: 'pointer', flexShrink: 0, marginBottom: 7 }}
                                        onClick={() => fileInputRef.current?.click()}
                                    />

                                    {/* 深度思考开关 */}
                                    <div
                                        onClick={() => setDeepThinking((prev) => !prev)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '4px 12px',
                                            borderRadius: 20,
                                            border: `1px solid ${deepThinking ? '#7C3AED' : '#d9d9d9'}`,
                                            background: deepThinking ? '#f3f0ff' : '#fff',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            flexShrink: 0,
                                            userSelect: 'none',
                                            marginBottom: 4,
                                        }}
                                    >
                                        <ThunderboltOutlined style={{
                                            fontSize: 14,
                                            color: deepThinking ? '#7C3AED' : '#8c8c8c',
                                        }} />
                                        <span style={{
                                            fontSize: 13,
                                            color: deepThinking ? '#7C3AED' : '#8c8c8c',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            深度思考
                                        </span>
                                    </div>

                                    {/* 发送按钮 */}
                                    <div
                                        onClick={handleSend}
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            background: inputValue.trim()
                                                ? '#7C3AED'
                                                : '#d9d9d9',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: inputValue.trim() ? 'pointer' : 'default',
                                            transition: 'background 0.2s',
                                            flexShrink: 0,
                                            marginBottom: 2,
                                        }}
                                    >
                                        <SendOutlined style={{ color: '#fff', fontSize: 16 }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 更多操作浮动菜单 */}
                    {moreMenuTaskId && (
                        <div
                            ref={menuRef}
                            style={{
                                position: 'absolute',
                                top: menuPos.top,
                                right: menuPos.right,
                                background: '#fff',
                                borderRadius: 12,
                                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                padding: '6px 0',
                                zIndex: 10,
                                minWidth: 130,
                            }}
                        >
                            {MORE_MENU_ITEMS.map((item) => (
                                <div
                                    key={item.key}
                                    onClick={() => setMoreMenuTaskId(null)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        padding: '10px 16px',
                                        cursor: 'pointer',
                                        color: item.key === 'delete' ? '#EF4444' : '#1E293B',
                                        fontSize: 15,
                                        fontWeight: 500,
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = '#F3F4F6';
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    }}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
