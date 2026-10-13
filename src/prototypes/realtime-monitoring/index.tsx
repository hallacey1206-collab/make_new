/**
 * @name 实时监测原型
 * @mode axure
 */

import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    CaretDownOutlined,
    CaretRightOutlined,
    ClockCircleOutlined,
    MenuOutlined,
    MoreOutlined,
    HomeOutlined,
    PauseOutlined,
    PlayCircleOutlined,
    TableOutlined,
    AppstoreOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
    FullscreenOutlined,
    DownloadOutlined,
    PrinterOutlined,
    ExportOutlined,
    EditOutlined,
    DeleteOutlined,
    StarFilled,
    LeftOutlined,
    RightOutlined,
} from '@ant-design/icons';
import {
    Button,
    ConfigProvider,
    DatePicker,
    Input,
    Modal,
    Popconfirm,
    Select,
    Space,
    Table,
    Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { defineHashPageRoute, useHashPage } from '../../common/useHashPage';
import { AnnotationViewer, type AnnotationSourceDocument } from '@axhub/annotation';
import annotationSource from './annotation-source.json';
import {
    dcsMenuData,
    processShortcuts,
    type MonitorPoint,
    type DeviceStatusBlock,
    stackerStatus,
    reclaimerStatus,
    trendTags,
    spanOptions,
    type TrendTag,
} from './data';
import './style.css';

const { RangePicker } = DatePicker;

// 双页面路由（DCS在线监视图 + 测点趋势）
const route = defineHashPageRoute([
    { id: 'dcs-monitor', title: 'DCS在线监视图' },
    { id: 'tag-trend', title: '测点趋势' },
], { defaultPageId: 'dcs-monitor' });

// 状态圆点颜色
const statusDotColor: Record<string, string> = {
    running: '#52c41a',
    stopped: '#bfbfbf',
    delay: '#bfbfbf',
    material: '#1677ff',
};

// ============ 页面1：DCS在线监视图 ============
function DcsMonitorPage() {
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['dcs']);
    const [activeMenu, setActiveMenu] = useState('lime-crush');
    const [activeShortcut, setActiveShortcut] = useState('RMProportion');
    // 右侧菜单功能Tab：监视图常驻；点击测点后新开"测点趋势"页签装载趋势页
    const [activeTab, setActiveTab] = useState<'monitor' | 'trend'>('monitor');
    const [trendTab, setTrendTab] = useState<{ tagId?: string; key: number; } | null>(null);

    // 打开（或激活）"测点趋势"页签，并装载指定测点的趋势
    const openTrendTab = (tagId?: string) => {
        setTrendTab({ tagId, key: Date.now() });
        setActiveTab('trend');
    };

    const toggleGroup = (key: string) => {
        setExpandedGroups((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
    };

    // 测点数值组件（点击跳转趋势页）
    const PointValue = ({ point }: { point: MonitorPoint }) => (
        <Tooltip title={`${point.tag} · 点击查看趋势`}>
            <span
                className="rtm-point-value"
                onClick={() => openTrendTab(point.id)}
            >
                {point.value} <em>{point.unit}</em>
            </span>
        </Tooltip>
    );

    // 位号标签
    const PointTag = ({ tag }: { tag: string }) => (
        <span className="rtm-point-tag">{tag}</span>
    );

    // 设备状态框
    const StatusBlock = ({ block }: { block: DeviceStatusBlock }) => (
        <div className="rtm-status-block">
            <div className="rtm-status-name">{block.name}</div>
            {block.lines.map((line) => (
                <div key={line.text} className="rtm-status-line">
                    <span className="rtm-status-dot" style={{ background: statusDotColor[line.status] }} />
                    <span>{line.text}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div className="rtm-page">
            {/* 左侧菜单 */}
            <aside className="rtm-sidebar" data-annotation-id="rtm-sidebar">
                <div className="rtm-sidebar-title">
                    <MenuOutlined />
                    <span>菜单模块</span>
                </div>
                <div className="rtm-menu">
                    {dcsMenuData.map((group) => (
                        <div key={group.key}>
                            <div
                                className="rtm-menu-group"
                                onClick={() => toggleGroup(group.key)}
                            >
                                {expandedGroups.includes(group.key)
                                    ? <CaretDownOutlined className="rtm-menu-caret" />
                                    : <CaretRightOutlined className="rtm-menu-caret" />}
                                <span>{group.title}</span>
                            </div>
                            {expandedGroups.includes(group.key) && group.children.map((item) => (
                                <div
                                    key={item.key}
                                    className={`rtm-menu-item${activeMenu === item.key ? ' active' : ''}`}
                                    onClick={() => setActiveMenu(item.key)}
                                >
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </aside>

            {/* 主区 */}
            <main className="rtm-main">
                {/* 菜单功能Tab页签：切换监视图 / 测点趋势 */}
                <div className="rtm-page-tabs" data-annotation-id="rtm-page-tabs">
                    <div
                        className={`rtm-page-tab${activeTab === 'monitor' ? ' active' : ''}`}
                        onClick={() => setActiveTab('monitor')}
                    >
                        监视图
                    </div>
                    {trendTab && (
                        <div
                            className={`rtm-page-tab${activeTab === 'trend' ? ' active' : ''}`}
                            onClick={() => setActiveTab('trend')}
                        >
                            测点趋势
                        </div>
                    )}
                </div>

                {/* 工具栏（监视图Tab内容） */}
                <div className="rtm-toolbar" style={{ display: activeTab === 'monitor' ? undefined : 'none' }}>
                    <Space size={4}>
                        <Button type="text" size="small" icon={<HomeOutlined />} title="首页" onClick={() => openTrendTab()} />
                        <Button type="text" size="small" icon={<ArrowLeftOutlined />} title="后退" />
                        <Button type="text" size="small" icon={<ArrowRightOutlined />} title="前进" />
                        <Button type="text" size="small" icon={<MoreOutlined />} title="更多操作" />
                    </Space>
                </div>

                {/* 流程图画布（监视图Tab内容） */}
                <div className="rtm-canvas-wrap" style={{ display: activeTab === 'monitor' ? 'flex' : 'none' }}>
                    {/* 左侧工序快捷按钮 */}
                    <div className="rtm-shortcuts" data-annotation-id="rtm-shortcuts">
                        {processShortcuts.map((item) => (
                            <button
                                key={item.key}
                                className={`rtm-shortcut-btn${activeShortcut === item.key ? ' active' : ''}`}
                                onClick={() => setActiveShortcut(item.key)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* 流程图主体 */}
                    <div className="rtm-canvas" data-annotation-id="rtm-canvas">
                        {/* 右上角监视状态 */}
                        <div className="rtm-monitoring-flag">
                            <span className="rtm-dot rtm-dot-green" />
                            <span>正在监视</span>
                        </div>
                        {/* 右上角图标组 */}
                        <div className="rtm-corner-icons">
                            <Tooltip title="列表查询"><TableOutlined /></Tooltip>
                            <Tooltip title="历史记录"><ClockCircleOutlined /></Tooltip>
                            <Tooltip title="视图切换"><AppstoreOutlined /></Tooltip>
                        </div>
                        {/* 右下角缩放 */}
                        <div className="rtm-zoom-icons">
                            <Tooltip title="放大"><ZoomInOutlined /></Tooltip>
                            <Tooltip title="缩小"><ZoomOutOutlined /></Tooltip>
                            <Tooltip title="全屏"><FullscreenOutlined /></Tooltip>
                        </div>

                        {/* 顶部：堆场进料区 */}
                        <div className="rtm-flow-top">
                            {/* 粘土料仓 */}
                            <div className="rtm-silo-area rtm-silo-clay">
                                <div className="rtm-truck" title="工程车">
                                    <div className="rtm-truck-body" />
                                    <div className="rtm-truck-cab" />
                                    <div className="rtm-truck-wheel rtm-truck-wheel-1" />
                                    <div className="rtm-truck-wheel rtm-truck-wheel-2" />
                                </div>
                                <div className="rtm-silo">
                                    <div className="rtm-silo-fill clay" style={{ height: '35%' }} />
                                    <div className="rtm-silo-label">Clay</div>
                                    <div className="rtm-silo-value"><span className="rtm-point-value" onClick={() => openTrendTab('AI2202L')}>4.8</span> M</div>
                                </div>
                                <div className="rtm-drive-group">
                                    <div className="rtm-drive-item"><span className="rtm-dot rtm-dot-yellow" /><PointValue point={{ id: 'AI0202A', tag: '02.02', value: '0.0', unit: 'A' }} /></div>
                                    <div className="rtm-drive-item"><span className="rtm-dot rtm-dot-yellow" /><PointValue point={{ id: 'AI0202F', tag: '02.02', value: '0', unit: 'Hz' }} /></div>
                                    <div className="rtm-drive-item"><PointTag tag="48 Hz" /></div>
                                </div>
                            </div>
                            {/* 石灰石料仓 */}
                            <div className="rtm-silo-area rtm-silo-limestone">
                                <div className="rtm-silo">
                                    <div className="rtm-silo-fill limestone" style={{ height: '92%' }} />
                                    <div className="rtm-silo-label">Limestone</div>
                                    <div className="rtm-silo-value"><span className="rtm-point-value" onClick={() => openTrendTab('AI2201L')}>0.6</span> M</div>
                                </div>
                                <div className="rtm-drive-group">
                                    <div className="rtm-drive-item"><span className="rtm-dot rtm-dot-yellow" /><PointTag tag="02.01" /></div>
                                    <div className="rtm-drive-item"><PointTag tag="02.011" /><PointValue point={{ id: 'AI02011A', tag: '02.011', value: '0.0', unit: 'A' }} /><PointValue point={{ id: 'AI02011F', tag: '02.011', value: '0', unit: 'Hz' }} /><PointTag tag="15 Hz" /></div>
                                    <div className="rtm-drive-item"><PointTag tag="02.012" /><PointValue point={{ id: 'AI02012A', tag: '02.012', value: '0.0', unit: 'A' }} /><PointValue point={{ id: 'AI02012F', tag: '02.012', value: '0.0', unit: 'Hz' }} /><PointValue point={{ id: 'AI02012T', tag: '02.012', value: '11h:19m', unit: '' }} /></div>
                                </div>
                            </div>
                            {/* 堆取料机角度 */}
                            <div className="rtm-angle-box">
                                <div className="rtm-angle-title">Angular</div>
                                <div className="rtm-angle-row">Stacker Angular：<PointValue point={{ id: 'AOAP2204', tag: 'AOAP2204', value: '30.0', unit: '°' }} /></div>
                                <div className="rtm-angle-row">Reclaimer Angular：<PointValue point={{ id: 'AIAP2205', tag: 'AIAP2205', value: '60.0', unit: '°' }} /></div>
                            </div>
                        </div>

                        {/* 中部：输送设备区 */}
                        <div className="rtm-flow-mid">
                            <div className="rtm-conveying-box">
                                <div className="rtm-conveying-title">Conveying_GP</div>
                                <div className="rtm-conveying-row">
                                    <PointTag tag="02.04a" /><PointValue point={{ id: 'AI0204A', tag: '02.04a', value: '0.3', unit: 'A' }} />
                                </div>
                                <div className="rtm-conveying-row">
                                    <PointTag tag="02.04.1" />
                                    <div className="rtm-conveying-vals">
                                        <PointValue point={{ id: 'AI020411A', tag: '02.04.1', value: '0.1', unit: 'A' }} />
                                        <PointValue point={{ id: 'TI020411B', tag: '02.04.1', value: '63.6', unit: '℃' }} />
                                        <PointValue point={{ id: 'TI020411C', tag: '02.04.1', value: '47.8', unit: '℃' }} />
                                        <PointValue point={{ id: 'TI020411D', tag: '02.04.1', value: '48.9', unit: '℃' }} />
                                        <PointValue point={{ id: 'TI020411E', tag: '02.04.1', value: '48.9', unit: '℃' }} />
                                        <PointValue point={{ id: 'TI020411E', tag: '02.04.1', value: '49.3', unit: '℃' }} />
                                        <PointValue point={{ id: 'TI020411F', tag: '02.04.1', value: '50.9', unit: '℃' }} />
                                        <PointValue point={{ id: 'TI020411G', tag: '02.04.1', value: '54.3', unit: '℃' }} />
                                        <PointValue point={{ id: 'VI020411A', tag: '02.04.1', value: '0.8', unit: 'mm/s' }} />
                                        <PointValue point={{ id: 'VI020411B', tag: '02.04.1', value: '1.5', unit: 'mm/s' }} />
                                    </div>
                                </div>
                                <div className="rtm-conveying-row">
                                    <PointTag tag="02.04.2" />
                                    <div className="rtm-conveying-vals">
                                        <PointValue point={{ id: 'AI020412A', tag: '02.04.2', value: '0.0', unit: 'A' }} />
                                        <PointValue point={{ id: 'TI020412B', tag: '02.04.2', value: '45.5', unit: '℃' }} />
                                        <PointValue point={{ id: 'TI020412C', tag: '02.04.2', value: '58.9', unit: '℃' }} />
                                        <PointValue point={{ id: 'TI020412D', tag: '02.04.2', value: '51.7', unit: '℃' }} />
                                        <PointValue point={{ id: 'TI020412E', tag: '02.04.2', value: '49.4', unit: '℃' }} />
                                        <PointValue point={{ id: 'TI020412F', tag: '02.04.2', value: '50.6', unit: '℃' }} />
                                        <PointValue point={{ id: 'TI020412G', tag: '02.04.2', value: '53.8', unit: '℃' }} />
                                        <PointValue point={{ id: 'TI020412G2', tag: '02.04.2', value: '53.6', unit: '℃' }} />
                                        <PointValue point={{ id: 'VI020412A', tag: '02.04.2', value: '0.5', unit: 'mm/s' }} />
                                        <PointValue point={{ id: 'VI020412B', tag: '02.04.2', value: '2.1', unit: 'mm/s' }} />
                                    </div>
                                </div>
                                <div className="rtm-conveying-row">
                                    <PointTag tag="02.08" /><PointValue point={{ id: 'LI0208', tag: '02.08', value: '0.1', unit: '%' }} />
                                    <span className="rtm-conveying-gap" />
                                    <PointTag tag="02.09" /><PointValue point={{ id: 'AI0209', tag: '02.09', value: '0.0', unit: 'A' }} />
                                </div>
                            </div>
                        </div>

                        {/* 皮带区 */}
                        <div className="rtm-belt-zone">
                            <div className="rtm-belt-row rtm-belt-upper">
                                <div className="rtm-hopper"><span className="rtm-hopper-label">22.02</span><span className="rtm-hopper-tag">22.03</span></div>
                                <div className="rtm-belt-motor"><PointTag tag="02.05" /><PointValue point={{ id: 'AI0205', tag: '02.05', value: '58.9', unit: 'A' }} /></div>
                                <div className="rtm-hopper"><span className="rtm-hopper-label">02.10</span><span className="rtm-hopper-tag">02.11</span></div>
                            </div>
                            <div className="rtm-belt-band rtm-belt-band-upper" />
                            <div className="rtm-belt-row rtm-belt-lower">
                                <div className="rtm-belt-motor">
                                    <PointTag tag="02.06" />
                                    <PointValue point={{ id: 'AI0206', tag: '02.06', value: '100.9', unit: 'A' }} />
                                    <PointValue point={{ id: 'WI0206', tag: '02.06', value: '0.0', unit: 't/h' }} />
                                </div>
                                <div className="rtm-belt-total">Total: <span className="rtm-point-value" onClick={() => openTrendTab('TOT0206')}>17683.20</span> ×100t</div>
                                <div className="rtm-belt-motor">
                                    <PointValue point={{ id: 'AI0207A', tag: '22.01', value: '65.2', unit: 'A' }} />
                                    <PointTag tag="22.01" />
                                    <PointTag tag="02.07" />
                                </div>
                            </div>
                            <div className="rtm-belt-band rtm-belt-band-lower" />
                            <div className="rtm-belt-feed">
                                <span className="rtm-dot rtm-dot-material" />
                                <span className="rtm-feed-label">Limestone and Clay</span>
                            </div>
                        </div>

                        {/* 堆取料机区 */}
                        <div className="rtm-machine-zone">
                            <StatusBlock block={stackerStatus} />
                            <div className="rtm-machine-icons">
                                <span className="rtm-dot rtm-dot-green" /><PointTag tag="22.05" />
                                <span className="rtm-dot rtm-dot-green" /><PointTag tag="22.07" />
                            </div>
                            <StatusBlock block={reclaimerStatus} />
                        </div>

                        {/* 底部出料皮带 */}
                        <div className="rtm-out-belt">
                            <div className="rtm-machine-icons">
                                <span className="rtm-dot rtm-dot-green" /><PointTag tag="22.10" />
                                <span className="rtm-dot rtm-dot-green" /><PointTag tag="22.08" />
                                <PointValue point={{ id: 'AI2208A', tag: '22.08', value: '126.1', unit: 'A' }} />
                            </div>
                            <div className="rtm-belt-band rtm-belt-band-out" />
                            <div className="rtm-out-arrow">To raw material proportioning station</div>
                        </div>
                    </div>
                </div>

                {/* 测点趋势Tab面板：点击测点后新开页签装载趋势页 */}
                <div
                    className="rtm-tab-pane"
                    style={{ display: activeTab === 'trend' && trendTab ? 'flex' : 'none' }}
                >
                    {trendTab && (
                        <TagTrendPage
                            key={trendTab.key}
                            initialTag={trendTab.tagId}
                            onBack={() => setActiveTab('monitor')}
                            embedded
                        />
                    )}
                </div>
            </main>
        </div>
    );
}

// ============ 页面2：测点趋势 ============
function TagTrendPage({ initialTag, onBack, embedded = false }: { initialTag?: string; onBack: () => void; embedded?: boolean }) {
    // 默认时间：以当前时间为结束，往前 24 小时
    const [span, setSpan] = useState<number>(24);
    const [rangeValue, setRangeValue] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
        dayjs().subtract(24, 'hour'),
        dayjs(),
    ]);
    const [visibleTags, setVisibleTags] = useState<string[]>(
        initialTag
            ? Array.from(new Set([initialTag, ...trendTags.slice(0, 3).map((t) => t.id)]))
            : trendTags.map((t) => t.id),
    );
    const [searchKeyword, setSearchKeyword] = useState('');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [rightCollapsed, setRightCollapsed] = useState(false);
    const [rightSelect, setRightSelect] = useState<string>(initialTag || trendTags[0].id);

    // 保存为测点组弹窗
    const [templateModalOpen, setTemplateModalOpen] = useState(false);
    const [templateName, setTemplateName] = useState('');
    // 已保存测点组列表（当前页面会话内维护）
    const [templates, setTemplates] = useState<{ name: string; tagIds: string[]; }[]>([]);
    // 当前选中的测点组名称（互斥：同一时间最多选中一个测点组；null 表示未选中）
    const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
    // 编辑测点组弹窗：editTargetName 记录正在改名的测点组原名（null 表示弹窗关闭）
    const [editTargetName, setEditTargetName] = useState<string | null>(null);
    const [editNameValue, setEditNameValue] = useState('');

    // 保存测点组：将当前图表中展示的测点存为新测点组（名称最长 50 字），并选中该测点组
    const handleSaveTemplate = () => {
        const name = templateName.trim().slice(0, 50);
        if (!name) {
            return;
        }
        setTemplates((prev) => [...prev, { name, tagIds: [...visibleTags] }]);
        setActiveTemplate(name);
        setTemplateModalOpen(false);
        setTemplateName('');
    };

    // 点击测点组：互斥选中该测点组，并重新加载右侧（图表与单测点面板）：不在测点组内的测点不再展示
    const handleSelectTemplate = (tpl: { name: string; tagIds: string[]; }) => {
        setActiveTemplate(tpl.name);
        setVisibleTags(tpl.tagIds);
        // 右侧单测点面板随测点组重新加载：当前测点不在测点组内时，切换到测点组的第一个测点
        if (tpl.tagIds.length > 0 && !tpl.tagIds.includes(rightSelect)) {
            setRightSelect(tpl.tagIds[0]);
        }
    };

    // 删除测点组：从列表移除；删除的是当前选中项时同时取消选中态
    const handleDeleteTemplate = (name: string) => {
        setTemplates((prev) => prev.filter((tpl) => tpl.name !== name));
        setActiveTemplate((prev) => (prev === name ? null : prev));
    };

    // 打开编辑弹窗：回填当前名称
    const openEditTemplate = (name: string) => {
        setEditTargetName(name);
        setEditNameValue(name);
    };

    // 编辑弹窗：新名称与其他测点组重名时禁止保存（避免列表键冲突）
    const editNameConflict = editTargetName !== null
        && editNameValue.trim() !== editTargetName
        && templates.some((tpl) => tpl.name === editNameValue.trim());

    // 编辑测点组名称：更新列表项；选中态同步跟随新名称
    const handleRenameTemplate = () => {
        const nextName = editNameValue.trim().slice(0, 50);
        if (!editTargetName || !nextName || editNameConflict) {
            return;
        }
        setTemplates((prev) => prev.map((tpl) => (tpl.name === editTargetName ? { ...tpl, name: nextName } : tpl)));
        setActiveTemplate((prev) => (prev === editTargetName ? nextName : prev));
        setEditTargetName(null);
        setEditNameValue('');
    };

    // 右侧单测点下拉框：只列出当前图表中展示的测点（选中测点组后即为测点组内的测点）
    const rightSelectOptions = useMemo(() => (
        trendTags
            .filter((t) => visibleTags.includes(t.id))
            .map((t) => ({ value: t.id, label: t.desc ? `${t.desc}（${t.id}）` : t.id }))
    ), [visibleTags]);

    // 生成模拟趋势数据
    const trendSeries = useMemo(() => {
        return trendTags
            .filter((t) => visibleTags.includes(t.id))
            .map((tag) => {
                const points: { time: string; value: number; }[] = [];
                const start = rangeValue[0];
                const stepMin = 3;
                const totalMin = rangeValue[1].diff(start, 'minute');
                for (let i = 0; i <= totalMin; i += stepMin) {
                    const t = start.add(i, 'minute');
                    const ratio = i / Math.max(totalMin, 1);
                    let v: number;
                    if (tag.id === 'AO3511FR') {
                        v = 15;
                    } else if (tag.id === 'AI0204M11Z1R') {
                        v = 15 + Math.sin(ratio * Math.PI * 4) * 12 + (Math.random() - 0.5) * 2;
                    } else if (tag.id === 'RMZFK') {
                        v = 430 + Math.sin(ratio * Math.PI * 6) * 14 + (Math.random() - 0.5) * 3;
                    } else {
                        v = 30 + Math.sin(ratio * Math.PI * 2) * 18 + (Math.random() - 0.5) * 3;
                    }
                    points.push({ time: t.format('MM-DD HH:mm'), value: Number(v.toFixed(2)) });
                }
                return { tag, points };
            });
    }, [visibleTags, rangeValue]);

    // 单测点数据列表（右侧）
    const detailData = useMemo(() => {
        const list: { key: string; time: string; value: number; }[] = [];
        const start = rangeValue[0];
        for (let i = 0; i <= 96; i++) {
            const t = start.add(i * 3, 'minute');
            let v = 15;
            if (rightSelect === 'AI0204M11Z1R') v = 15 + Math.sin(i / 8) * 12;
            if (rightSelect === 'RMZFK') v = 430 + Math.sin(i / 5) * 14;
            if (rightSelect === 'AOAP2204') v = 30 + Math.sin(i / 12) * 18;
            list.push({ key: String(i), time: t.format('MM-DD HH:mm'), value: Number(v.toFixed(2)) });
        }
        return list;
    }, [rightSelect, rangeValue]);

    // SVG 折线图
    const chartAreaRef = useRef<HTMLDivElement | null>(null);
    const chartSvgRef = useRef<SVGSVGElement | null>(null);
    const [chartSize, setChartSize] = useState({ width: 900, height: 320 });
    // 提示卡片实际尺寸（用于边缘自动翻转定位）
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const [tooltipSize, setTooltipSize] = useState({ width: 240, height: 150 });
    // 鼠标悬浮信息：xRatio 用于取值，vbX/vbY 用于 SVG 十字线定位，areaX/areaY 用于提示卡片在区域内自适应定位
    const [hoverInfo, setHoverInfo] = useState<{ xRatio: number; vbX: number; vbY: number; areaX: number; areaY: number; } | null>(null);
    // 右侧数据表格容器（动态测量高度，让表格填满面板，避免下方留白）
    const rightTableWrapRef = useRef<HTMLDivElement | null>(null);
    const [rightTableHeight, setRightTableHeight] = useState(420);
    // 右侧表格每页行数：按容器高度动态计算（预留表头 39px 与分页器约 32px，行高约 39px）
    const rightPageSize = Math.max(3, Math.floor((rightTableHeight - 39 - 32) / 39));
    // 右侧表格当前页码（切换测点/时间范围后回到第一页）
    const [rightPage, setRightPage] = useState(1);
    // 切换测点或时间范围后回到第一页
    useEffect(() => {
        setRightPage(1);
    }, [rightSelect, rangeValue]);

    // 测量右侧表格容器高度（随窗口/面板伸缩自动更新）
    useEffect(() => {
        const el = rightTableWrapRef.current;
        if (!el) {
            return undefined;
        }
        const update = () => {
            const h = el.clientHeight;
            if (h > 0) {
                setRightTableHeight((prev) => (Math.abs(prev - h) < 1 ? prev : h));
            }
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        const el = chartSvgRef.current;
        if (!el) {
            return undefined;
        }
        const update = () => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setChartSize((prev) => (Math.abs(prev.width - rect.width) < 1 && Math.abs(prev.height - rect.height) < 1)
                    ? prev
                    : { width: Math.round(rect.width), height: Math.round(rect.height) });
            }
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // 提示卡片尺寸变化时重新测量（下一帧用实际尺寸校正定位）
    useEffect(() => {
        const el = tooltipRef.current;
        if (!el) {
            return;
        }
        const rect = el.getBoundingClientRect();
        setTooltipSize((prev) => (Math.abs(prev.width - rect.width) < 1 && Math.abs(prev.height - rect.height) < 1)
            ? prev
            : { width: rect.width, height: rect.height });
    }, [hoverInfo]);

    // 视图窗口（浮点下标 0~1）：滚轮缩放/拖动只改变显示范围，不改动数据
    const [view, setView] = useState({ start: 0, end: 1 });
    const viewRef = useRef({ start: 0, end: 1 });
    useEffect(() => {
        viewRef.current = view;
    }, [view]);
    // 拖动状态（用 ref 记录，避免高频 setState）
    const dragRef = useRef<{ pointerX: number; start: number; end: number; } | null>(null);
    const [dragging, setDragging] = useState(false);

    const setViewSafe = (nextStart: number, nextEnd: number) => {
        const start = Math.min(Math.max(nextStart, 0), 1);
        const end = Math.min(Math.max(nextEnd, start + 0.02), 1);
        setView({ start, end });
    };

    // 数据（时间范围/可见测点）变化时重置视图窗口
    useEffect(() => {
        setView({ start: 0, end: 1 });
    }, [trendSeries]);

    const chartWidth = chartSize.width;
    const chartHeight = chartSize.height;
    const padL = 70;
    // 其余测点 y 轴只在右缘标注最大/最小值，不再占用图表空间
    const padR = 20;
    const padT = 24;
    const padB = 40;

    // 按视图窗口截取各测点可见数据
    const fullLen = trendSeries[0]?.points.length ?? 0;
    const iStart = Math.floor(view.start * Math.max(fullLen - 1, 0));
    const iEnd = Math.ceil(view.end * Math.max(fullLen - 1, 0));
    const viewSeries = trendSeries.map((s) => ({ ...s, points: s.points.slice(iStart, iEnd + 1) }));

    // 每个测点独立 y 轴：按当前可见数据的取值范围归一化占满绘图区，数据均匀分布在图表上下中间
    const seriesRange = viewSeries.map((s) => {
        const vals = s.points.map((p) => p.value);
        const min = vals.length ? Math.min(...vals) : 0;
        const max = vals.length ? Math.max(...vals) : 100;
        const pad = (max - min) * 0.15 || 5;
        return { low: min - pad, high: max + pad };
    });
    const plotW = chartWidth - padL - padR;
    const plotH = chartHeight - padT - padB;
    const x2p = (i: number, len: number) => padL + (i / Math.max(len - 1, 1)) * plotW;
    const y2pSeries = (seriesIdx: number, v: number) => {
        const { low, high } = seriesRange[seriesIdx] || { low: 0, high: 100 };
        return padT + (1 - (v - low) / (high - low)) * plotH;
    };

    // 折线 path（每条线用各自的 y 轴映射，仅绘制当前视图窗口内的数据）
    const linePath = (seriesIdx: number) => {
        const s = viewSeries[seriesIdx];
        if (!s || s.points.length === 0) {
            return '';
        }
        return s.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x2p(i, s.points.length).toFixed(1)},${y2pSeries(seriesIdx, p.value).toFixed(1)}`).join(' ');
    };

    // 单系列 y 轴刻度（5 档）
    const yTicksSeries = (seriesIdx: number) => {
        const { low, high } = seriesRange[seriesIdx] || { low: 0, high: 100 };
        return [0, 0.25, 0.5, 0.75, 1].map((r) => low + (high - low) * r);
    };
    // x 轴刻度（6 段）
    const xTickCount = 6;
    const xTicks = Array.from({ length: xTickCount + 1 }, (_, i) => Math.round((i / xTickCount) * (trendSeries[0]?.points.length ?? 0 - 1)));

    // 测点汇总表
    const summaryColumns: ColumnsType<TrendTag> = [
        {
            title: '测点编码', dataIndex: 'id', key: 'id', width: 150,
            sorter: (a, b) => a.id.localeCompare(b.id),
            render: (_, record) => (
                <span className="rtm-tag-color" style={{ color: record.color }}>{record.id}</span>
            ),
        },
        { title: '测点名称', dataIndex: 'desc', key: 'desc', width: 200, sorter: (a, b) => a.desc.localeCompare(b.desc) },
        { title: '当前值时间', dataIndex: 'currentTime', key: 'currentTime', width: 170, sorter: (a, b) => a.currentTime.localeCompare(b.currentTime) },
        { title: '当前值', dataIndex: 'currentValue', key: 'currentValue', width: 100, sorter: (a, b) => a.currentValue - b.currentValue },
        { title: '单位', dataIndex: 'unit', key: 'unit', width: 70 },
        { title: '最小值时间', dataIndex: 'minTime', key: 'minTime', width: 170, sorter: (a, b) => a.minTime.localeCompare(b.minTime) },
        { title: '最小值', dataIndex: 'minValue', key: 'minValue', width: 100, sorter: (a, b) => a.minValue - b.minValue },
        { title: '最大值时间', dataIndex: 'maxTime', key: 'maxTime', width: 170, sorter: (a, b) => a.maxTime.localeCompare(b.maxTime) },
        { title: '最大值', dataIndex: 'maxValue', key: 'maxValue', width: 100, sorter: (a, b) => a.maxValue - b.maxValue },
    ];

    const toggleTag = (id: string) => {
        setVisibleTags((prev) => {
            const next = prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id];
            // 右侧正在查看的测点被取消勾选后，切换到剩余可见测点的第一个，避免右侧仍显示已隐藏的测点
            if (id === rightSelect && next.length > 0) {
                setRightSelect(next[0]);
            }
            return next;
        });
        // 手动勾选图例后退出测点组选中态，保证测点组选中与实际展示测点一致
        setActiveTemplate(null);
    };

    // 鼠标在图表内移动：拖动中平移视图，否则更新悬浮信息
    const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const drag = dragRef.current;
        if (drag) {
            // 拖动平移：按鼠标位移换算成数据窗口平移量（向右拖看更早的数据）
            const rect = e.currentTarget.getBoundingClientRect();
            if (rect.width <= 0) {
                return;
            }
            const dxRatio = (e.clientX - drag.pointerX) / rect.width;
            const dataShift = dxRatio * (chartWidth / Math.max(plotW, 1)) * (drag.end - drag.start);
            setViewSafe(drag.start - dataShift, drag.end - dataShift);
            return;
        }
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
            return;
        }
        const vbX = ((e.clientX - rect.left) / rect.width) * chartWidth;
        const vbY = ((e.clientY - rect.top) / rect.height) * chartHeight;
        if (vbX < padL || vbX > chartWidth - padR || vbY < padT || vbY > chartHeight - padB) {
            setHoverInfo(null);
            return;
        }
        // 相对图表区（含标题区域）的坐标，用于提示卡片定位
        const area = chartAreaRef.current;
        const areaRect = area ? area.getBoundingClientRect() : rect;
        const areaX = e.clientX - areaRect.left;
        const areaY = e.clientY - areaRect.top;
        const xRatio = (vbX - padL) / Math.max(plotW, 1);
        setHoverInfo({ xRatio, vbX, vbY, areaX, areaY });
    };

    // 按下左键开始拖动（以按下时的窗口为基准平移）
    const handleChartMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
        if (e.button !== 0) {
            return;
        }
        dragRef.current = { pointerX: e.clientX, start: viewRef.current.start, end: viewRef.current.end };
        setDragging(true);
    };

    const handleChartMouseUp = () => {
        if (dragRef.current) {
            dragRef.current = null;
            setDragging(false);
        }
    };

    const handleChartMouseLeave = () => {
        handleChartMouseUp();
        setHoverInfo(null);
    };

    // 双击恢复完整范围
    const handleChartDoubleClick = () => setViewSafe(0, 1);

    // 滚轮缩放（原生监听，React 的 wheel 事件是 passive 无法阻止默认行为）：以鼠标位置为中心放大/缩小
    useEffect(() => {
        const el = chartSvgRef.current;
        if (!el) {
            return undefined;
        }
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0) {
                return;
            }
            const vbX = ((e.clientX - rect.left) / rect.width) * chartWidth;
            if (vbX < padL || vbX > chartWidth - padR) {
                return;
            }
            const { start, end } = viewRef.current;
            const anchor = start + ((vbX - padL) / Math.max(plotW, 1)) * (end - start);
            const factor = e.deltaY < 0 ? 0.85 : 1 / 0.85;
            let nextStart = anchor - (anchor - start) * factor;
            let nextEnd = nextStart + (end - start) * factor;
            nextStart = Math.min(Math.max(nextStart, 0), 1);
            nextEnd = Math.min(Math.max(nextEnd, nextStart + 0.02), 1);
            setView({ start: nextStart, end: nextEnd });
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [chartWidth, plotW, padL, padR]);

    // 按测点组名称过滤测点组列表
    const filteredTemplates = templates.filter(
        (tpl) => !searchKeyword || tpl.name.toLowerCase().includes(searchKeyword.toLowerCase()),
    );

    return (
        <div className={`rtm-trend-page${embedded ? ' embedded' : ''}`}>
            {/* 顶部工具栏 */}
            <div className="rtm-trend-toolbar" data-annotation-id="rtm-trend-toolbar">
                <div className="rtm-trend-toolbar-left">
                    <Button className="rtm-trend-back" icon={<ArrowLeftOutlined />} onClick={onBack}>返回监视图</Button>
                    <span className="rtm-trend-span-label">时间跨度:</span>
                    <div className="rtm-trend-spans">
                        {spanOptions.map((opt) => (
                            <button
                                key={opt.value}
                                className={`rtm-span-btn${span === opt.value ? ' active' : ''}`}
                                onClick={() => {
                                    setSpan(opt.value);
                                    setRangeValue([dayjs().subtract(opt.value, 'hour'), dayjs()]);
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <span className="rtm-trend-query-label">查询时间:</span>
                    <RangePicker
                        showTime
                        value={rangeValue}
                        onChange={(v) => v && v[0] && v[1] && setRangeValue([v[0], v[1]])}
                        className="rtm-trend-range"
                    />
                    <Button type="primary" onClick={() => setRangeValue([...rangeValue])}>查 看</Button>
                </div>
                <div className="rtm-trend-toolbar-right">
                    <Tooltip title="实时数据"><Button type="text" icon={<PlayCircleOutlined />} /></Tooltip>
                    <Tooltip title="停止实时"><Button type="text" icon={<PauseOutlined />} /></Tooltip>
                    <Tooltip title="导出图片"><Button type="text" icon={<DownloadOutlined />} /></Tooltip>
                    <Tooltip title="打印"><Button type="text" icon={<PrinterOutlined />} /></Tooltip>
                    <Tooltip title="新窗口打开"><Button type="text" icon={<ExportOutlined />} onClick={() => window.open(window.location.href, '_blank', 'noopener,noreferrer')} /></Tooltip>
                </div>
            </div>

            <div className="rtm-trend-body">
                {/* 左侧测点搜索栏 */}
                <aside
                    className={`rtm-trend-side${sidebarCollapsed ? ' collapsed' : ''}`}
                    data-annotation-id="rtm-trend-side"
                >
                    <div className="rtm-trend-side-collapse" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                        <LeftOutlined />
                    </div>
                    <div className="rtm-trend-side-inner">
                        <div className="rtm-trend-search-row">
                            <Input
                                placeholder="测点组名称"
                                allowClear
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                            />
                        </div>
                        <Button
                            className="rtm-trend-fav"
                            icon={<StarFilled />}
                            onClick={() => setTemplateModalOpen(true)}
                        >
                            保存为测点组
                        </Button>
                        {/* 测点组列表：点击测点组快速加载其中的测点，名称过长自动省略，hover 显示完整信息与编辑/删除按钮 */}
                        <div className="rtm-trend-tag-list">
                            {filteredTemplates.map((tpl) => (
                                <Tooltip key={tpl.name} title={tpl.name} placement="right" mouseEnterDelay={0.3}>
                                    <div
                                        className={`rtm-trend-tag-item${activeTemplate === tpl.name ? ' active' : ''}`}
                                        onClick={() => handleSelectTemplate(tpl)}
                                    >
                                        <StarFilled style={{ color: '#1677ff', fontSize: 12 }} />
                                        <span className="rtm-trend-tag-id">{tpl.name}</span>
                                        <span className="rtm-trend-tag-desc">{`${tpl.tagIds.length} 个测点`}</span>
                                        <span className="rtm-trend-tag-actions" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                type="text"
                                                size="small"
                                                icon={<EditOutlined />}
                                                title="编辑"
                                                onClick={() => openEditTemplate(tpl.name)}
                                            />
                                            <Popconfirm
                                                title="确认删除该测点组？"
                                                okText="删除"
                                                cancelText="取消"
                                                onConfirm={() => handleDeleteTemplate(tpl.name)}
                                            >
                                                <Button type="text" size="small" danger icon={<DeleteOutlined />} title="删除" />
                                            </Popconfirm>
                                        </span>
                                    </div>
                                </Tooltip>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* 中部趋势图（占满整块区域，悬浮显示数据提示卡片） */}
                <section className="rtm-trend-chart-area" data-annotation-id="rtm-trend-chart-area" ref={chartAreaRef}>
                    <div className="rtm-trend-chart-title">趋势图</div>
                    <svg
                        className={`rtm-trend-svg${dragging ? ' dragging' : ''}`}
                        ref={chartSvgRef}
                        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                        preserveAspectRatio="none"
                        onMouseMove={handleChartMouseMove}
                        onMouseDown={handleChartMouseDown}
                        onMouseUp={handleChartMouseUp}
                        onDoubleClick={handleChartDoubleClick}
                        onMouseLeave={handleChartMouseLeave}
                    >
                        {/* y 轴：左侧为第一条可见曲线的完整轴；其余测点仅在右缘上下角标注最大/最小值，不占用图表空间 */}
                        {viewSeries.map((s, seriesIdx) => {
                            const decimals = s.tag.id === 'RMZFK' ? 0 : 1;
                            const { low, high } = seriesRange[seriesIdx] || { low: 0, high: 100 };
                            const otherIdx = seriesIdx - 1;
                            return (
                                <g key={`axis-${s.tag.id}`}>
                                    {seriesIdx === 0 && yTicksSeries(0).map((v, ti) => (
                                        <g key={`yt-0-${ti}`}>
                                            <line
                                                x1={padL}
                                                y1={y2pSeries(0, v)}
                                                x2={chartWidth - padR}
                                                y2={y2pSeries(0, v)}
                                                stroke="#f0f0f0"
                                                strokeWidth={1}
                                            />
                                            <text
                                                x={padL - 8}
                                                y={y2pSeries(0, v) + 4}
                                                textAnchor="end"
                                                fontSize={11}
                                                fill={s.tag.color}
                                            >
                                                {v.toFixed(decimals)}
                                            </text>
                                        </g>
                                    ))}
                                    {seriesIdx > 0 && (
                                        <React.Fragment>
                                            {/* 最大值（顶部边缘，多组时自左向右横向错开） */}
                                            <text
                                                x={padL + 8 + otherIdx * 42}
                                                y={padT + 10}
                                                textAnchor="start"
                                                fontSize={11}
                                                fill={s.tag.color}
                                            >
                                                {high.toFixed(decimals)}
                                            </text>
                                            {/* 最小值（底部边缘，与顶部同组横向对齐） */}
                                            <text
                                                x={padL + 8 + otherIdx * 42}
                                                y={chartHeight - padB - 4}
                                                textAnchor="start"
                                                fontSize={11}
                                                fill={s.tag.color}
                                            >
                                                {low.toFixed(decimals)}
                                            </text>
                                        </React.Fragment>
                                    )}
                                </g>
                            );
                        })}
                        {/* x 轴刻度（仅当前视图窗口） */}
                        {viewSeries[0]?.points.length > 0 && viewSeries[0].points.map((p, i) => {
                            const len = viewSeries[0].points.length;
                            if (i % Math.max(1, Math.ceil(len / xTickCount)) !== 0) return null;
                            return (
                                <g key={`xt-${i}`}>
                                    <line x1={x2p(i, len)} y1={padT} x2={x2p(i, len)} y2={chartHeight - padB} stroke="#fafafa" strokeWidth={1} />
                                    <text x={x2p(i, len)} y={chartHeight - padB + 16} textAnchor="middle" fontSize={11} fill="#666">{p.time}</text>
                                </g>
                            );
                        })}
                        {/* 折线 */}
                        {trendSeries.map((s, seriesIdx) => (
                            <path key={s.tag.id} d={linePath(seriesIdx)} fill="none" stroke={s.tag.color} strokeWidth={1.6} />
                        ))}
                        {/* 悬浮十字线 */}
                        {hoverInfo && (
                            <g className="rtm-trend-crosshair">
                                <line
                                    x1={hoverInfo.vbX} y1={padT}
                                    x2={hoverInfo.vbX} y2={chartHeight - padB}
                                    stroke="#999"
                                    strokeWidth={1}
                                    strokeDasharray="4 3"
                                />
                                {viewSeries.map((s, seriesIdx) => {
                                    const idx = Math.round(hoverInfo.xRatio * (s.points.length - 1));
                                    const pt = s.points[idx];
                                    if (!pt) return null;
                                    return (
                                        <circle
                                            key={`hp-${s.tag.id}`}
                                            cx={x2p(idx, s.points.length)}
                                            cy={y2pSeries(seriesIdx, pt.value)}
                                            r={3.5}
                                            fill="#fff"
                                            stroke={s.tag.color}
                                            strokeWidth={1.6}
                                        />
                                    );
                                })}
                            </g>
                        )}
                    </svg>
                    {/* 悬浮数据提示卡片（HTML 层，跟随鼠标并在边缘自动翻转，始终保持在区域内） */}
                    {hoverInfo && viewSeries.length > 0 && (() => {
                        const idx = Math.round(hoverInfo.xRatio * (viewSeries[0].points.length - 1));
                        const timeLabel = viewSeries[0].points[idx]?.time ?? '';
                        const areaEl = chartAreaRef.current;
                        const areaW = areaEl ? areaEl.clientWidth : 0;
                        const areaH = areaEl ? areaEl.clientHeight : 0;
                        const margin = 8;
                        const tipW = tooltipSize.width;
                        const tipH = tooltipSize.height;
                        // 默认显示在鼠标右下方；靠近右边缘翻转到左侧，靠近下边缘贴底，始终保持在图表区内
                        let left = hoverInfo.areaX + 14;
                        let top = hoverInfo.areaY + 12;
                        if (areaW > 0 && left + tipW + margin > areaW) {
                            left = hoverInfo.areaX - tipW - 14;
                        }
                        if (areaH > 0 && top + tipH + margin > areaH) {
                            top = areaH - tipH - margin;
                        }
                        if (left < margin) {
                            left = margin;
                        }
                        if (top < margin) {
                            top = margin;
                        }
                        return (
                            <div
                                className="rtm-trend-tooltip"
                                ref={tooltipRef}
                                style={{ left, top }}
                            >
                                <div className="rtm-trend-tooltip-time">{timeLabel}</div>
                                {viewSeries.map((s) => {
                                    const idx2 = Math.round(hoverInfo.xRatio * (s.points.length - 1));
                                    const pt = s.points[idx2];
                                    if (!pt) return null;
                                    return (
                                        <div key={s.tag.id} className="rtm-trend-tooltip-row">
                                            <span className="rtm-trend-tooltip-dot" style={{ background: s.tag.color }} />
                                            <span className="rtm-trend-tooltip-name">{s.tag.desc ? `${s.tag.desc}（${s.tag.id}）` : s.tag.id}</span>
                                            <span className="rtm-trend-tooltip-value">{pt.value} {s.tag.unit}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                    {/* 图例：选中测点组时仅显示测点组内的测点；未选测点组时显示全部测点（未勾选的置灰，可重新勾选） */}
                    <div className="rtm-trend-legend">
                        {(activeTemplate ? trendTags.filter((t) => visibleTags.includes(t.id)) : trendTags).map((t) => (
                            <label key={t.id} className="rtm-trend-legend-item" style={{ color: visibleTags.includes(t.id) ? t.color : '#bbb' }}>
                                <input type="checkbox" checked={visibleTags.includes(t.id)} onChange={() => toggleTag(t.id)} />
                                <span>{t.desc ? `${t.desc} [${t.id}]` : `[${t.id}]`}</span>
                            </label>
                        ))}
                    </div>
                </section>

                {/* 保存为测点组弹窗 */}
                <Modal
                    title="保存为测点组"
                    open={templateModalOpen}
                    onOk={handleSaveTemplate}
                    okButtonProps={{ disabled: !templateName.trim() }}
                    onCancel={() => { setTemplateModalOpen(false); setTemplateName(''); }}
                    okText="保存"
                    cancelText="取消"
                    width={420}
                >
                    <div style={{ marginBottom: 8 }}>测点组名称（最长 50 字）</div>
                    <Input
                        placeholder="请输入测点组名称"
                        maxLength={50}
                        showCount
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        onPressEnter={handleSaveTemplate}
                    />
                    <div style={{ marginTop: 12, color: '#888', fontSize: 12 }}>
                        将保存当前图表中展示的 {visibleTags.length} 个测点：{visibleTags.join('、')}
                    </div>
                </Modal>

                {/* 编辑测点组弹窗：修改测点组名称 */}
                <Modal
                    title="编辑测点组"
                    open={editTargetName !== null}
                    onOk={handleRenameTemplate}
                    okButtonProps={{ disabled: !editNameValue.trim() || editNameConflict }}
                    onCancel={() => { setEditTargetName(null); setEditNameValue(''); }}
                    okText="保存"
                    cancelText="取消"
                    width={420}
                >
                    <div style={{ marginBottom: 8 }}>测点组名称（最长 50 字）</div>
                    <Input
                        placeholder="请输入测点组名称"
                        maxLength={50}
                        showCount
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        onPressEnter={handleRenameTemplate}
                    />
                    {editNameConflict && (
                        <div style={{ marginTop: 8, color: '#ff4d4f', fontSize: 12 }}>该名称已存在，请换一个</div>
                    )}
                    {editTargetName && (
                        <div style={{ marginTop: 12, color: '#888', fontSize: 12 }}>
                            共 {templates.find((tpl) => tpl.name === editTargetName)?.tagIds.length ?? 0} 个测点：
                            {templates.find((tpl) => tpl.name === editTargetName)?.tagIds.join('、')}
                        </div>
                    )}
                </Modal>

                {/* 右侧单测点数据 */}
                <aside
                    className={`rtm-trend-right${rightCollapsed ? ' collapsed' : ''}`}
                    data-annotation-id="rtm-trend-right"
                >
                    <div className="rtm-trend-right-collapse" onClick={() => setRightCollapsed(!rightCollapsed)}>
                        <RightOutlined />
                    </div>
                    <div className="rtm-trend-right-inner">
                        <div className="rtm-trend-right-select-row">
                            <Select
                                style={{ flex: 1, minWidth: 0 }}
                                value={rightSelect}
                                onChange={setRightSelect}
                                options={rightSelectOptions}
                            />
                            <Button type="text" icon={<DownloadOutlined />} title="下载" />
                        </div>
                        <div className="rtm-trend-right-table" ref={rightTableWrapRef}>
                            <Table
                                size="small"
                                rowKey="key"
                                columns={[
                                    { title: '时间', dataIndex: 'time', key: 'time' },
                                    { title: '值', dataIndex: 'value', key: 'value' },
                                ]}
                                dataSource={detailData}
                                pagination={{
                                    current: rightPage,
                                    pageSize: rightPageSize,
                                    total: detailData.length,
                                    onChange: (p) => setRightPage(p),
                                    size: 'small',
                                    simple: true,
                                    showSizeChanger: false,
                                    showTotal: (t) => `共 ${t} 条`,
                                }}
                                scroll={{ y: rightPageSize * 39 }}
                            />
                        </div>
                    </div>
                </aside>
            </div>

            {/* 底部测点信息汇总表 */}
            <div className="rtm-trend-summary" data-annotation-id="rtm-trend-summary">
                <Table<TrendTag>
                    size="small"
                    rowKey="id"
                    columns={summaryColumns}
                    dataSource={trendTags}
                    pagination={false}
                    scroll={{ x: 1200 }}
                />
            </div>
        </div>
    );
}

// ============ 主组件 ============
export default function Component() {
    const { page, setPage } = useHashPage(route);

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#1677ff',
                    borderRadius: 4,
                    fontSize: 14,
                },
            }}
        >
            {page === 'tag-trend'
                ? <TagTrendPage onBack={() => setPage('dcs-monitor')} />
                : <DcsMonitorPage />}
            {/* 标注运行时：功能说明与需求要点（数据见 annotation-source.json） */}
            <AnnotationViewer
                source={annotationSource as AnnotationSourceDocument}
                options={{
                    currentPageId: page,
                    showToolbar: true,
                    showThemeToggle: true,
                    showColorFilter: true,
                }}
            />
        </ConfigProvider>
    );
}
