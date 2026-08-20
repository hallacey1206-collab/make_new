/**
 * 项目执行页面
 * 包含：项目列表 + 项目详情（基本信息/合同信息/执行填报/操作记录）
 */
import React, { useState } from 'react';
import {
    Button,
    Card,
    Checkbox,
    Col,
    DatePicker,
    Descriptions,
    Empty,
    Form,
    Input,
    InputNumber,
    Pagination,
    Popconfirm,
    Row,
    Select,
    Space,
    Table,
    Tabs,
    Tag,
    Timeline,
    TreeSelect,
    Typography,
    Upload,
    message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TabsProps } from 'antd';
import type { TreeDataNode } from 'antd';
import {
    CaretDownOutlined,
    CaretRightOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseOutlined,
    DeleteOutlined,
    DownloadOutlined,
    FileTextOutlined,
    MinusOutlined,
    PaperClipOutlined,
    PlusOutlined,
    SearchOutlined,
    ReloadOutlined,
    UploadOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { orgTreeData } from './data';
import iconCompleted from './assets/icon-completed.png';
import iconBehind from './assets/icon-behind.png';
import iconProgress from './assets/icon-progress.png';

const { Text, Title } = Typography;

// ============ 类型定义 ============

type ProjectLevel = 'key' | 'normal';

interface ContractRecord {
    id: string;
    signDate: string;
    supplier: string;
    amount: number;
    duration: number; // 月
    attachment?: string;
}

interface ExecutionNodeRecord {
    id: string;
    name: string;
    order: number;
    planDate?: string;
    actualDate?: string;
    cumulativePayment?: number;
    progress?: number;
    onlineDate?: string; // 仅最终验收
    templates: string[];
    attachments: string[];
    remark?: string;
}

interface OperationLog {
    id: string;
    node: string;
    department: string;
    operator: string;
    time: string;
    result: string;
    opinion: string;
}

interface ProjectRecord {
    id: string;
    name: string;
    company: string;
    projectLevel: ProjectLevel;
    manager: string;
    startDate: string;
    endDate: string;
    currentStage: string;
    plannedStage: string;
    progress: number;
    totalPayment: number;
    paymentRatio: number;
    nodeStatus: string;
    // 详情
    code: string;
    filingDate: string;
    applicant: string;
    contactPhone: string;
    isIndependent: string;
    budgetPlan: string;
    budgetCode: string;
    buildLocation: string;
    projectType: string;
    coverageScope: string;
    hasCrossDomainData: string;
    isHeadquartersInterface: string;
    totalInvestment: number;
    yearBudget: number;
    totalProjectInvestment: number;
    selfFunding: number;
    externalFunding: number;
    otherFunding: number;
    brief: string;
    buildMode: string;
    buildType: string;
    contracts: ContractRecord[];
    executionNodes: ExecutionNodeRecord[];
    operationLogs: OperationLog[];
}

// ============ 工具函数 ============

const genId = () => '_' + Math.random().toString(36).slice(2, 9);

function formatMoney(value: number) {
    return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function computeMonths(startDate: string, endDate: string): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return Math.max(1, Math.round(diffMonths));
}

const STAGE_ORDER = ['项目启动', '周报', '需求确认', '方案设计', '测试', '预验收', '最终验收'];

function isStageBehind(current: string, planned: string): boolean {
    if (!current || !planned) return false;
    const currentIdx = STAGE_ORDER.indexOf(current);
    const plannedIdx = STAGE_ORDER.indexOf(planned);
    if (currentIdx === -1 || plannedIdx === -1) return false;
    return currentIdx < plannedIdx;
}

// ============ 模板下载列表 ============

const STARTUP_TEMPLATES = [
    '技术开发合同模板(供参考)',
    '数字化采购项目合同模板(供参考)',
    '信息化运维服务合同模板(供参考)',
    '项目组织模板(甲乙双方)(需上传)',
];

const NODE_TEMPLATES: Record<string, string[]> = {
    '周报': ['项目周报模板'],
    '需求确认': ['需求确认书模板'],
    '方案设计': ['方案设计文档模板'],
    '测试': ['测试报告模板'],
    '预验收': ['预验收报告模板'],
    '最终验收': ['最终验收报告模板'],
};

// 组织树仅叶子节点下挂模拟人员（含联系电话），与备案管理保持一致
const businessTreeData: TreeDataNode[] = (() => {
    let personId = 0;
    const mockNames = ['张明', '李华', '王芳', '赵强', '陈静', '刘洋', '周磊', '吴敏', '郑伟', '孙悦'];
    const mockPhones = ['13800138001', '13900139002', '13700137003', '13600136004', '13500135005', '13400134006', '13300133007', '13200132008', '13100131009', '13000130010'];
    const addPersonnel = (nodes: TreeDataNode[]): TreeDataNode[] =>
        nodes.map((node) => {
            const hasChildren = node.children && node.children.length > 0;
            if (hasChildren) {
                return {
                    ...node,
                    checkable: false,
                    children: addPersonnel(node.children as TreeDataNode[]),
                };
            }
            const count = 2 + (personId % 2);
            const personnel: TreeDataNode[] = Array.from({ length: count }, () => {
                const name = mockNames[personId % mockNames.length];
                const phone = mockPhones[personId % mockPhones.length];
                const p: TreeDataNode = {
                    title: `${name} · ${phone}`,
                    key: `${node.key}-person-${personId}`,
                };
                personId++;
                return p;
            });
            return {
                ...node,
                checkable: false,
                children: personnel,
            };
        });
    return addPersonnel(orgTreeData as TreeDataNode[]);
})();

// ============ 模拟数据 ============

const currentYear = new Date().getFullYear();

const MOCK_PROJECTS: ProjectRecord[] = [
    {
        id: 'pe-001',
        name: '2026预算填报测试071001',
        company: '中材国际（南京）',
        projectLevel: 'key',
        manager: '',
        startDate: '2026-07-01',
        endDate: '2027-06-30',
        currentStage: '项目启动',
        plannedStage: '周报',
        progress: 10,
        totalPayment: 0,
        paymentRatio: 0,
        nodeStatus: '进行中',
        code: `${currentYear}_2071139461050580993`,
        filingDate: `${currentYear}-06-28`,
        applicant: '张工',
        contactPhone: '13800138001',
        isIndependent: '是',
        budgetPlan: '年度计划内',
        budgetCode: '632904-7BLYLX',
        buildLocation: '国内',
        projectType: '系统建设类',
        coverageScope: '覆盖中材国际（南京）全部业务流程，包括生产管理、质量管理、设备管理、供应链管理及行政管理等模块。',
        hasCrossDomainData: '否',
        isHeadquartersInterface: '否',
        totalInvestment: 350,
        yearBudget: 200,
        totalProjectInvestment: 420,
        selfFunding: 200,
        externalFunding: 100,
        otherFunding: 50,
        brief: '围绕中材国际（南京）现有数字化平台，进行整体升级改造，涵盖ERP、MES和OA系统。',
        buildMode: '单位自建',
        buildType: '优化',
        contracts: [],
        executionNodes: [
            { id: 'en-001', name: '项目启动', order: 1, templates: STARTUP_TEMPLATES, attachments: [], remark: '立项启动需上传合同和项目组织证明材料(见模板);单个附件不超过50M' },
            { id: 'en-002', name: '周报', order: 2, templates: ['项目周报模板'], attachments: [], remark: '项目启动后每周上传项目周报' },
            { id: 'en-003', name: '需求确认', order: 3, templates: ['需求确认书模板'], attachments: [], remark: '需求确认阶段需上传需求确认书' },
            { id: 'en-004', name: '方案设计', order: 4, templates: ['方案设计文档模板'], attachments: [], remark: '方案设计阶段需上传方案设计文档' },
            { id: 'en-005', name: '测试', order: 5, templates: ['测试报告模板'], attachments: [], remark: '测试阶段需上传测试报告' },
            { id: 'en-006', name: '预验收', order: 6, templates: ['预验收报告模板'], attachments: [], remark: '预验收阶段需上传预验收报告' },
            { id: 'en-007', name: '最终验收', order: 7, templates: ['最终验收报告模板'], attachments: [], remark: '最终验收阶段需上传最终验收报告' },
        ],
        operationLogs: [
            { id: 'op-001', node: '开始', department: '系统', operator: '系统自动执行', time: `${currentYear}-07-10 10:56:01`, result: '开始', opinion: '流程开始' },
        ],
    },
    {
        id: 'pe-002',
        name: '2026预算填报测试071002',
        company: '中材国际（南京）',
        projectLevel: 'normal',
        manager: '',
        startDate: '2026-07-01',
        endDate: '2028-06-30',
        currentStage: '项目启动',
        plannedStage: '项目启动',
        progress: 0,
        totalPayment: 0,
        paymentRatio: 0,
        nodeStatus: '节点资料待上传',
        code: `${currentYear}_2071139461050580994`,
        filingDate: `${currentYear}-06-28`,
        applicant: '李工',
        contactPhone: '13900139002',
        isIndependent: '否',
        budgetPlan: '年度计划外',
        budgetCode: '632904-8CLYMX',
        buildLocation: '国内',
        projectType: '运维服务类',
        coverageScope: '中材国际（南京）数字化运维项目，覆盖基础设施运维和应用系统运维。',
        hasCrossDomainData: '否',
        isHeadquartersInterface: '否',
        totalInvestment: 180,
        yearBudget: 80,
        totalProjectInvestment: 200,
        selfFunding: 80,
        externalFunding: 80,
        otherFunding: 40,
        brief: '中材国际（南京）数字化运维项目，保障系统稳定运行。',
        buildMode: '外包',
        buildType: '新建',
        contracts: [],
        executionNodes: [
            { id: 'en-101', name: '项目启动', order: 1, templates: STARTUP_TEMPLATES, attachments: [], remark: '立项启动需上传合同和项目组织证明材料(见模板);单个附件不超过50M' },
            { id: 'en-102', name: '周报', order: 2, templates: ['项目周报模板'], attachments: [], remark: '项目启动后每周上传项目周报' },
            { id: 'en-103', name: '需求确认', order: 3, templates: ['需求确认书模板'], attachments: [], remark: '需求确认阶段需上传需求确认书' },
            { id: 'en-104', name: '方案设计', order: 4, templates: ['方案设计文档模板'], attachments: [], remark: '方案设计阶段需上传方案设计文档' },
            { id: 'en-105', name: '测试', order: 5, templates: ['测试报告模板'], attachments: [], remark: '测试阶段需上传测试报告' },
            { id: 'en-106', name: '预验收', order: 6, templates: ['预验收报告模板'], attachments: [], remark: '预验收阶段需上传预验收报告' },
            { id: 'en-107', name: '最终验收', order: 7, templates: ['最终验收报告模板'], attachments: [], remark: '最终验收阶段需上传最终验收报告' },
        ],
        operationLogs: [
            { id: 'op-101', node: '开始', department: '系统', operator: '系统自动执行', time: `${currentYear}-07-10 10:56:01`, result: '开始', opinion: '流程开始' },
        ],
    },
    // 第三条：正常进行中（进度 60%，当前阶段不滞后）
    {
        id: 'pe-003',
        name: '2026预算填报测试071003',
        company: '中建材投资',
        projectLevel: 'key',
        manager: '',
        startDate: '2026-01-15',
        endDate: '2027-01-14',
        currentStage: '方案设计',
        plannedStage: '方案设计',
        progress: 60,
        totalPayment: 120,
        paymentRatio: 30,
        nodeStatus: '进行中',
        code: `${currentYear}_2071139461050580995`,
        filingDate: `${currentYear}-01-10`,
        applicant: '王工',
        contactPhone: '13700137003',
        isIndependent: '是',
        budgetPlan: '年度计划内',
        budgetCode: '632904-9DLYNZ',
        buildLocation: '国内',
        projectType: '系统建设类',
        coverageScope: '中建材投资数字化平台建设，覆盖投资管理、风控合规及数据分析。',
        hasCrossDomainData: '否',
        isHeadquartersInterface: '否',
        totalInvestment: 500,
        yearBudget: 300,
        totalProjectInvestment: 600,
        selfFunding: 300,
        externalFunding: 150,
        otherFunding: 50,
        brief: '中建材投资综合数字化平台建设项目。',
        buildMode: '单位自建',
        buildType: '新建',
        contracts: [],
        executionNodes: [
            { id: 'en-201', name: '项目启动', order: 1, templates: STARTUP_TEMPLATES, attachments: [], remark: '立项启动需上传合同和项目组织证明材料(见模板);单个附件不超过50M' },
            { id: 'en-202', name: '周报', order: 2, templates: ['项目周报模板'], attachments: [], remark: '项目启动后每周上传项目周报' },
            { id: 'en-203', name: '需求确认', order: 3, templates: ['需求确认书模板'], attachments: [], remark: '需求确认阶段需上传需求确认书' },
            { id: 'en-204', name: '方案设计', order: 4, templates: ['方案设计文档模板'], attachments: [], remark: '方案设计阶段需上传方案设计文档' },
            { id: 'en-205', name: '测试', order: 5, templates: ['测试报告模板'], attachments: [], remark: '测试阶段需上传测试报告' },
            { id: 'en-206', name: '预验收', order: 6, templates: ['预验收报告模板'], attachments: [], remark: '预验收阶段需上传预验收报告' },
            { id: 'en-207', name: '最终验收', order: 7, templates: ['最终验收报告模板'], attachments: [], remark: '最终验收阶段需上传最终验收报告' },
        ],
        operationLogs: [
            { id: 'op-201', node: '开始', department: '系统', operator: '系统自动执行', time: `${currentYear}-01-15 09:00:00`, result: '开始', opinion: '流程开始' },
        ],
    },
    // 第四条：已完成（进度 100%）
    {
        id: 'pe-004',
        name: '2026预算填报测试071004',
        company: '凯盛科技',
        projectLevel: 'normal',
        manager: '',
        startDate: '2025-06-01',
        endDate: '2026-05-31',
        currentStage: '最终验收',
        plannedStage: '最终验收',
        progress: 100,
        totalPayment: 280,
        paymentRatio: 100,
        nodeStatus: '已完成',
        code: `${currentYear-1}_2071139461050580996`,
        filingDate: `${currentYear-1}-05-28`,
        applicant: '赵工',
        contactPhone: '13600136004',
        isIndependent: '否',
        budgetPlan: '年度计划内',
        budgetCode: '632904-10ELYOA',
        buildLocation: '国内',
        projectType: '运维服务类',
        coverageScope: '凯盛科技运维项目，保障集团系统稳定运行。',
        hasCrossDomainData: '否',
        isHeadquartersInterface: '否',
        totalInvestment: 280,
        yearBudget: 280,
        totalProjectInvestment: 280,
        selfFunding: 280,
        externalFunding: 0,
        otherFunding: 0,
        brief: '凯盛科技年度运维服务项目。',
        buildMode: '外包',
        buildType: '优化',
        contracts: [],
        executionNodes: [
            { id: 'en-301', name: '项目启动', order: 1, templates: STARTUP_TEMPLATES, attachments: [], remark: '立项启动需上传合同和项目组织证明材料(见模板);单个附件不超过50M' },
            { id: 'en-302', name: '周报', order: 2, templates: ['项目周报模板'], attachments: [], remark: '项目启动后每周上传项目周报' },
            { id: 'en-303', name: '需求确认', order: 3, templates: ['需求确认书模板'], attachments: [], remark: '需求确认阶段需上传需求确认书' },
            { id: 'en-304', name: '方案设计', order: 4, templates: ['方案设计文档模板'], attachments: [], remark: '方案设计阶段需上传方案设计文档' },
            { id: 'en-305', name: '测试', order: 5, templates: ['测试报告模板'], attachments: [], remark: '测试阶段需上传测试报告' },
            { id: 'en-306', name: '预验收', order: 6, templates: ['预验收报告模板'], attachments: [], remark: '预验收阶段需上传预验收报告' },
            { id: 'en-307', name: '最终验收', order: 7, templates: ['最终验收报告模板'], attachments: [], remark: '最终验收阶段需上传最终验收报告' },
        ],
        operationLogs: [
            { id: 'op-301', node: '开始', department: '系统', operator: '系统自动执行', time: `${currentYear-1}-06-01 09:00:00`, result: '开始', opinion: '流程开始' },
        ],
    },
];

// ============ 样式常量 ============

const labelStyle: React.CSSProperties = {
    fontSize: 13, color: 'rgba(0,0,0,0.55)', flexShrink: 0,
    minWidth: 120, textAlign: 'right', marginRight: 8, lineHeight: '28px',
};
const valueStyle: React.CSSProperties = { fontSize: 13, color: 'rgba(0,0,0,0.85)', wordBreak: 'break-all', lineHeight: '28px' };
const itemStyle: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', minWidth: 0 };
const itemStyleFull: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gridColumn: '1 / -1', minWidth: 0 };

// ============ 主组件 ============

export default function ProjectExecutionPage() {
    const [projects, setProjects] = useState<ProjectRecord[]>(MOCK_PROJECTS);
    const [searchName, setSearchName] = useState('');
    const [searchYear, setSearchYear] = useState(`${currentYear}年`);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);

    // 筛选
    const filteredProjects = projects.filter(p => {
        if (searchName && !p.name.includes(searchName)) return false;
        return true;
    });
    const pagedProjects = filteredProjects.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleSearch = () => {
        setCurrentPage(1);
    };

    const handleReset = () => {
        setSearchName('');
        setSearchYear(`${currentYear}年`);
        setCurrentPage(1);
    };

    const handleOpenDetail = (record: ProjectRecord) => {
        setSelectedProject(record);
        setDetailVisible(true);
    };

    const handleCloseDetail = () => {
        setDetailVisible(false);
        setSelectedProject(null);
    };

    const handleProgressChange = (progress: number) => {
        if (selectedProject) {
            setProjects(prev => prev.map(p =>
                p.id === selectedProject.id ? { ...p, progress } : p
            ));
        }
    };

    // ============ 列表表格列 ============

    const columns: ColumnsType<ProjectRecord> = [
        {
            title: '序号', width: 60, align: 'center', fixed: 'left',
            render: (_, __, index) => index + 1 + (currentPage - 1) * pageSize,
        },
        { title: '项目名称', dataIndex: 'name', width: 220, ellipsis: true, fixed: 'left' },
        { title: '公司', dataIndex: 'company', width: 160, ellipsis: true, fixed: 'left' },
        {
            title: '项目级别', dataIndex: 'projectLevel', width: 90, align: 'center',
            render: (v: ProjectLevel) => <Tag color={v === 'key' ? 'red' : 'default'}>{v === 'key' ? '重点项目' : '普通项目'}</Tag>,
        },
        { title: '项目经理', dataIndex: 'manager', width: 90, render: (v: string) => v || <Text type="secondary">-</Text> },
        { title: '开始时间', dataIndex: 'startDate', width: 110 },
        { title: '结束时间', dataIndex: 'endDate', width: 110 },
        { title: '当前阶段', dataIndex: 'currentStage', width: 100, render: (v: string) => v || <Text type="secondary">-</Text> },
        { title: '计划阶段', dataIndex: 'plannedStage', width: 100, render: (v: string) => v || <Text type="secondary">-</Text> },
        {
            title: '项目进度', dataIndex: 'progress', width: 120, align: 'center',
            render: (v: number, record: ProjectRecord) => {
                const behind = isStageBehind(record.currentStage, record.plannedStage);
                const completed = v === 100;
                if (behind) {
                    return <span style={{ color: '#e60012', fontWeight: 'bold' }}><img src={iconBehind} style={{ width: 16, height: 16, marginRight: 4, verticalAlign: 'middle', marginTop: -2 }} />{v}%</span>;
                }
                if (completed) {
                    return <span style={{ color: '#52c41a', fontWeight: 'bold' }}><img src={iconCompleted} style={{ width: 16, height: 16, verticalAlign: 'middle', marginTop: -2 }} /></span>;
                }
                return <span style={{ color: '#1677ff' }}><img src={iconProgress} style={{ width: 16, height: 16, marginRight: 4, verticalAlign: 'middle', marginTop: -2 }} />{v}%</span>;
            },
        },
        { title: '累计付款金额', dataIndex: 'totalPayment', width: 120, align: 'right', render: (v: number) => v },
        { title: '付款比例', dataIndex: 'paymentRatio', width: 90, align: 'center', render: (v: number) => `${v.toFixed(2)}%` },
        {
            title: '节点状态', dataIndex: 'nodeStatus', width: 90, align: 'center',
            render: (v: string) => <Tag color="blue">{v}</Tag>,
        },
        {
            title: '操作', width: 70, align: 'center', fixed: 'right',
            render: (_, record) => (
                <Button type="link" danger size="small" onClick={() => handleOpenDetail(record)}>编辑</Button>
            ),
        },
    ];

    // ============ 渲染 ============

    if (detailVisible && selectedProject) {
        return <ProjectDetail project={selectedProject} onClose={handleCloseDetail} onProgressChange={handleProgressChange} />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
            {/* 页面标题 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 16, background: '#e60012', borderRadius: 2 }} />
                <Text strong style={{ fontSize: 15 }}>项目进度跟踪表</Text>
            </div>

            {/* 查询区 */}
            <Card size="small" style={{ flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text>项目名称</Text>
                        <Input
                            value={searchName}
                            onChange={e => setSearchName(e.target.value)}
                            placeholder="项目名称"
                            style={{ width: 200 }}
                            allowClear
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text>年度</Text>
                        <Select
                            value={searchYear}
                            onChange={v => setSearchYear(v)}
                            style={{ width: 120 }}
                            options={[
                                { value: '2026年', label: '2026年' },
                                { value: '2025年', label: '2025年' },
                                { value: '2024年', label: '2024年' },
                            ]}
                        />
                    </div>
                    <Space>
                        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}
                            style={{ background: '#e60012', borderColor: '#e60012' }}>查询</Button>
                        <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
                    </Space>
                </div>
            </Card>

            {/* 表格 */}
            <Card size="small" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Table<ProjectRecord>
                    columns={columns}
                    dataSource={pagedProjects}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    scroll={{ x: 1600 }}
                    style={{ flex: 1, overflow: 'auto' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '12px 0 0' }}>
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={filteredProjects.length}
                        showSizeChanger
                        showTotal={total => `共${total}条`}
                        pageSizeOptions={['10', '20', '50']}
                        onChange={(page, size) => { setCurrentPage(page); setPageSize(size); }}
                    />
                </div>
            </Card>
        </div>
    );
}

// ============ 项目详情组件 ============

function ProjectDetail({ project, onClose, onProgressChange }: { project: ProjectRecord; onClose: () => void; onProgressChange: (progress: number) => void }) {
    const [activeTab, setActiveTab] = useState('execution');
    const [contracts, setContracts] = useState<ContractRecord[]>(project.contracts);
    const [selectedContractKeys, setSelectedContractKeys] = useState<string[]>([]);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([project.executionNodes[0]?.id]));
    const [nodeProgress, setNodeProgress] = useState<Record<string, number>>(
        () => Object.fromEntries(project.executionNodes.map(n => [n.id, n.progress ?? 0]))
    );

    const handleNodeProgressChange = (nodeId: string, value: number) => {
        setNodeProgress(prev => {
            const next = { ...prev, [nodeId]: value };
            const nonFirstNodes = project.executionNodes.slice(1);
            const total = nonFirstNodes.reduce((sum, n) => sum + (next[n.id] ?? 0), 0);
            const avg = nonFirstNodes.length > 0 ? Math.round(total / nonFirstNodes.length) : 0;
            onProgressChange(avg);
            return next;
        });
    };

    const handleAddContract = () => {
        const newContract: ContractRecord = {
            id: genId(),
            signDate: '',
            supplier: '',
            amount: 0,
            duration: 0,
        };
        setContracts([...contracts, newContract]);
        message.success('已新增合同行');
    };

    const handleDeleteContracts = () => {
        if (selectedContractKeys.length === 0) {
            message.warning('请先选择要删除的合同');
            return;
        }
        setContracts(contracts.filter(c => !selectedContractKeys.includes(c.id)));
        setSelectedContractKeys([]);
        message.success(`已删除${selectedContractKeys.length}条合同`);
    };

    const handleUpdateContract = (id: string, field: keyof ContractRecord, value: string | number) => {
        setContracts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } as ContractRecord : c));
    };

    const handleToggleNode = (nodeId: string) => {
        const next = new Set(expandedNodes);
        if (next.has(nodeId)) next.delete(nodeId);
        else next.add(nodeId);
        setExpandedNodes(next);
    };

    // ============ Tab 内容 ============

    const basicInfoContent = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 顶部信息条 */}
            <div style={{ display: 'flex', gap: 24, padding: '12px 16px', background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0', flexWrap: 'wrap' }}>
                <span><Text type="secondary">申请单位：</Text>{project.company}</span>
                <span><Text type="secondary">备案号：</Text><code style={{ fontSize: 12 }}>{project.code}</code></span>
                <span><Text type="secondary">日期：</Text>{project.filingDate}</span>
            </div>

            {/* 项目基本情况 */}
            <Card size="small" title="项目基本情况">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                    <div style={itemStyle}><span style={labelStyle}>项目立项人</span><span style={valueStyle}>{project.applicant}</span></div>
                    <div style={itemStyle}><span style={labelStyle}>联系方式</span><span style={valueStyle}>{project.contactPhone}</span></div>
                    <div style={itemStyleFull}><span style={labelStyle}>项目名称</span><span style={valueStyle}>{project.name}</span></div>
                    <div style={itemStyle}><span style={labelStyle}>独立/非独立</span><span style={valueStyle}>{project.isIndependent}</span></div>
                    <div style={itemStyle}><span style={labelStyle}>项目预算计划</span><span style={valueStyle}>{project.budgetPlan}</span></div>
                    <div style={itemStyleFull}><span style={labelStyle}>预算编号</span><span style={valueStyle}><code>{project.budgetCode}</code></span></div>
                    <div style={itemStyle}><span style={labelStyle}>项目建设地点</span><span style={valueStyle}>{project.buildLocation}</span></div>
                    <div style={itemStyle}><span style={labelStyle}>项目级别</span><span style={valueStyle}><Tag color={project.projectLevel === 'key' ? 'red' : 'default'}>{project.projectLevel === 'key' ? '重点项目' : '普通项目'}</Tag></span></div>
                    <div style={itemStyle}><span style={labelStyle}>项目类型</span><span style={valueStyle}>{project.projectType}</span></div>
                    <div style={itemStyle}><span style={labelStyle}>建设模式</span><span style={valueStyle}>{project.buildMode}</span></div>
                    <div style={itemStyle}><span style={labelStyle}>建设类型</span><span style={valueStyle}>{project.buildType}</span></div>
                    <div style={itemStyleFull}><span style={labelStyle}>项目覆盖范围</span><span style={valueStyle}>{project.coverageScope}</span></div>
                    <div style={itemStyleFull}><span style={labelStyle}>主要建设内容</span><span style={valueStyle}>{project.brief}</span></div>
                    <div style={itemStyle}><span style={labelStyle}>计划开始建设时间</span><span style={valueStyle}>{project.startDate}</span></div>
                    <div style={itemStyle}><span style={labelStyle}>计划结束建设时间</span><span style={valueStyle}>{project.endDate}</span></div>
                    <div style={itemStyle}><span style={labelStyle}>计划建设工期</span><span style={valueStyle}>{computeMonths(project.startDate, project.endDate)} 个月</span></div>
                    <div style={itemStyle}><span style={labelStyle}>是否有跨域数据权限</span><span style={valueStyle}>{project.hasCrossDomainData}</span></div>
                    <div style={itemStyle}><span style={labelStyle}>是否总部接口</span><span style={valueStyle}>{project.isHeadquartersInterface}</span></div>
                </div>
            </Card>

            {/* 项目投入情况 */}
            <Card size="small" title="项目投入情况">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 24px' }}>
                    <div style={itemStyle}><span style={labelStyle}>当年预算(万元)</span><span style={valueStyle}>¥{formatMoney(project.yearBudget)}</span></div>
                    <div style={itemStyle}><span style={labelStyle}>预算总额(万元)</span><span style={valueStyle}>¥{formatMoney(project.totalInvestment)}</span></div>
                    <div style={itemStyle}><span style={labelStyle}>项目总投资(万元)</span><span style={valueStyle}>¥{formatMoney(project.totalProjectInvestment)}</span></div>
                    <div style={itemStyle}><span style={labelStyle}>自有资金(万元)</span><span style={valueStyle}>¥{formatMoney(project.selfFunding)}</span></div>
                    <div style={itemStyle}><span style={labelStyle}>外部资金(万元)</span><span style={valueStyle}>¥{formatMoney(project.externalFunding)}</span></div>
                    <div style={itemStyle}><span style={labelStyle}>其他资金(万元)</span><span style={valueStyle}>¥{formatMoney(project.otherFunding)}</span></div>
                </div>
            </Card>

            {/* 附件 */}
            <Card size="small" title="附件">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <PaperClipOutlined style={{ color: '#999' }} />
                        <Text style={{ color: '#1677ff' }}>项目立项申请表.pdf</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <PaperClipOutlined style={{ color: '#999' }} />
                        <Text style={{ color: '#1677ff' }}>项目可行性研究报告.docx</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <PaperClipOutlined style={{ color: '#999' }} />
                        <Text style={{ color: '#1677ff' }}>会议纪要.pdf</Text>
                    </div>
                </div>
            </Card>
        </div>
    );

    // ============ 合同信息 Tab ============

    const contractColumns: ColumnsType<ContractRecord> = [
        {
            title: '合同签订时间', dataIndex: 'signDate', width: 160,
            render: (v: string, record: ContractRecord) => <DatePicker size="small" style={{ width: '100%' }} onChange={(_, dateStr) => handleUpdateContract(record.id, 'signDate', dateStr)} />,
        },
        {
            title: '供应商', dataIndex: 'supplier', width: 200,
            render: (v: string, record: ContractRecord) => <Input size="small" value={v} onChange={e => handleUpdateContract(record.id, 'supplier', e.target.value)} placeholder="请输入" />,
        },
        {
            title: '合同金额(万元)', dataIndex: 'amount', width: 130, align: 'right' as const,
            render: (v: number, record: ContractRecord) => <InputNumber size="small" value={v} onChange={val => handleUpdateContract(record.id, 'amount', val || 0)} placeholder="请输入" style={{ width: '100%' }} />,
        },
        {
            title: '合同期限(月)', dataIndex: 'duration', width: 110, align: 'center' as const,
            render: (v: number, record: ContractRecord) => <InputNumber size="small" value={v} onChange={val => handleUpdateContract(record.id, 'duration', val || 0)} placeholder="请输入" style={{ width: '100%' }} />,
        },
        {
            title: '合同附件', dataIndex: 'attachment', width: 150,
            render: () => <Upload beforeUpload={() => false} maxCount={1}><Button size="small" icon={<UploadOutlined />}>上传</Button></Upload>,
        },
    ];

    const contractInfoContent = (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Text strong>合同签订</Text>
                <Button shape="circle" size="small" icon={<PlusOutlined />} onClick={handleAddContract}
                    style={{ borderColor: '#e60012', color: '#e60012' }} />
                <Button shape="circle" size="small" icon={<MinusOutlined />} onClick={handleDeleteContracts}
                    style={{ borderColor: '#e60012', color: '#e60012' }} />
            </div>
            <Table<ContractRecord>
                columns={contractColumns}
                dataSource={contracts}
                rowKey="id"
                size="small"
                pagination={false}
                rowSelection={{
                    selectedRowKeys: selectedContractKeys,
                    onChange: (keys) => setSelectedContractKeys(keys as string[]),
                }}
                scroll={{ x: 730 }}
                locale={{ emptyText: '暂无数据' }}
            />
        </div>
    );

    // ============ 执行填报 Tab ============

    const executionFillContent = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {project.executionNodes.map((node, index) => {
                const isExpanded = expandedNodes.has(node.id);
                const isFirst = index === 0;
                return (
                    <div key={node.id} style={{ border: '1px solid #f0f0f0', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
                        {/* 节点头部 */}
                        <div
                            style={{
                                display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px',
                                background: '#fafafa', cursor: 'pointer',
                            }}
                            onClick={() => handleToggleNode(node.id)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                {isExpanded ? <CaretDownOutlined style={{ fontSize: 12, color: '#999' }} /> : <CaretRightOutlined style={{ fontSize: 12, color: '#999' }} />}
                                <Text strong>{index + 1}. {node.name}</Text>
                            </div>
                            <Text type="secondary" style={{ fontSize: 13 }}>计划完成: {node.planDate || '—'}</Text>
                            <Text type="secondary" style={{ fontSize: 13 }}>实际完成: {node.actualDate || '—'}</Text>
                            {!isFirst && (
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }} onClick={e => e.stopPropagation()}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Text style={{ fontSize: 13 }}>项目进度:</Text>
                                        <InputNumber
                                            size="small"
                                            min={0}
                                            max={100}
                                            placeholder="0-100"
                                            style={{ width: 80 }}
                                            value={nodeProgress[node.id] ?? 0}
                                            onChange={v => handleNodeProgressChange(node.id, v ?? 0)}
                                        />
                                        <Text style={{ fontSize: 13 }}>%</Text>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Text style={{ fontSize: 13 }}>累计付款:</Text>
                                        <InputNumber
                                            size="small"
                                            placeholder="请输入"
                                            style={{ width: 100 }}
                                            value={node.cumulativePayment}
                                            onChange={v => {
                                                const updated = project.executionNodes.map(n =>
                                                    n.id === node.id ? { ...n, cumulativePayment: v || 0 } : n
                                                );
                                                project.executionNodes = updated;
                                            }}
                                        />
                                        <Text style={{ fontSize: 13 }}>万元</Text>
                                    </div>
                                    {node.name === '最终验收' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Text style={{ fontSize: 13 }}>上线时间:</Text>
                                            <DatePicker size="small" placeholder="请选择日期" style={{ width: 140 }} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 节点展开内容 */}
                        {isExpanded && (
                            <div style={{ padding: '16px', background: '#fff' }}>
                                {isFirst ? <StartupNodeContent node={node} /> : <RegularNodeContent node={node} />}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    // ============ 操作记录 Tab ============

    const operationLogColumns: ColumnsType<OperationLog> = [
        { title: '序号', width: 60, align: 'center', render: (_, __, i) => i + 1 },
        { title: '操作节点', dataIndex: 'node', width: 140 },
        { title: '操作部门', dataIndex: 'department', width: 120 },
        { title: '操作人员', dataIndex: 'operator', width: 120 },
        { title: '操作时间', dataIndex: 'time', width: 170 },
        { title: '审批结果', dataIndex: 'result', width: 100, render: (v: string) => <Tag>{v}</Tag> },
        { title: '审批意见', dataIndex: 'opinion', ellipsis: false },
    ];

    const operationLogContent = (
        <Table<OperationLog>
            columns={operationLogColumns}
            dataSource={project.operationLogs}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ x: 900 }}
        />
    );

    // ============ Tabs 配置 ============

    const tabItems: TabsProps['items'] = [
        { key: 'basic', label: '基本信息', children: basicInfoContent },
        { key: 'contract', label: '合同信息', children: contractInfoContent },
        { key: 'execution', label: '执行填报', children: executionFillContent },
        { key: 'log', label: '操作记录', children: operationLogContent },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
            {/* 顶部标题栏 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 3, height: 16, background: '#e60012', borderRadius: 2 }} />
                    <Text strong style={{ fontSize: 15 }}>数字化项目立项备案表</Text>
                </div>
                <Button icon={<CloseOutlined />} onClick={onClose}>关闭</Button>
            </div>

            {/* Tabs */}
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                style={{ flex: 1, minHeight: 0 }}
                tabBarStyle={{ marginBottom: 12 }}
            />
        </div>
    );
}

// ============ 项目启动节点内容 ============

function StartupNodeContent({ node }: { node: ExecutionNodeRecord }) {
    const [orgForm] = Form.useForm();
    const [contracts, setContracts] = useState<ContractRecord[]>([]);
    const [selectedContractKeys, setSelectedContractKeys] = useState<string[]>([]);

    const handleAddContract = () => {
        setContracts([...contracts, { id: genId(), signDate: '', supplier: '', amount: 0, duration: 0 }]);
    };

    const handleDeleteContracts = () => {
        if (selectedContractKeys.length === 0) { message.warning('请先选择要删除的合同'); return; }
        setContracts(contracts.filter(c => !selectedContractKeys.includes(c.id)));
        setSelectedContractKeys([]);
    };

    const contractColumns = [
        { title: '合同签订时间', dataIndex: 'signDate', width: 150, render: () => <DatePicker size="small" style={{ width: '100%' }} /> },
        { title: '供应商', dataIndex: 'supplier', width: 180, render: () => <Input size="small" placeholder="请输入" /> },
        { title: '合同金额(万元)', dataIndex: 'amount', width: 130, render: () => <InputNumber size="small" placeholder="请输入" style={{ width: '100%' }} /> },
        { title: '合同期限(月)', dataIndex: 'duration', width: 120, render: () => <InputNumber size="small" placeholder="请输入" style={{ width: '100%' }} /> },
        { title: '合同附件', dataIndex: 'attachment', width: 150, render: () => <Button size="small" icon={<UploadOutlined />}>上传</Button> },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 模板下载 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text>模板下载:</Text>
                {node.templates.map((tpl, i) => (
                    <Button key={i} size="small" icon={<DownloadOutlined />} style={{ fontSize: 12 }}>{tpl}</Button>
                ))}
            </div>

            {/* 项目节点时间填报 */}
            <Card size="small" title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 3, height: 14, background: '#e60012', borderRadius: 2 }} /><span>项目节点时间填报</span></div>}
                extra={<Space><Button type="primary" size="small" style={{ background: '#e60012', borderColor: '#e60012' }}>提交</Button><Button type="primary" size="small" style={{ background: '#e60012', borderColor: '#e60012' }}>保存</Button></Space>}
            >
                {/* 项目组织情况 */}
                <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ marginBottom: 8, display: 'block' }}>项目组织情况</Text>
                    <Form form={orgForm} layout="vertical" size="small">
                        <Row gutter={16}>
                            <Col span={12}><Form.Item label="项目出资人"><Input placeholder="请输入" /></Form.Item></Col>
                            <Col span={12}><Form.Item label="项目负责人"><Input placeholder="请输入" /></Form.Item></Col>
                            <Col span={12}><Form.Item label="甲方项目经理"><TreeSelect treeData={businessTreeData} placeholder="请选择人员" style={{ width: '100%' }} fieldNames={{ value: 'key', label: 'title', children: 'children' }} showSearch treeNodeFilterProp="title" treeDefaultExpandAll /></Form.Item></Col>
                            <Col span={12}><Form.Item label="甲方技术经理"><TreeSelect treeData={businessTreeData} placeholder="请选择人员" style={{ width: '100%' }} fieldNames={{ value: 'key', label: 'title', children: 'children' }} showSearch treeNodeFilterProp="title" treeDefaultExpandAll /></Form.Item></Col>
                            <Col span={12}><Form.Item label="甲方业务经理"><TreeSelect treeData={businessTreeData} placeholder="请选择人员" style={{ width: '100%' }} fieldNames={{ value: 'key', label: 'title', children: 'children' }} showSearch treeNodeFilterProp="title" treeDefaultExpandAll /></Form.Item></Col>
                            <Col span={12}>
                                <Form.Item label="乙方项目经理">
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <Input placeholder="请输入姓名" style={{ flex: 1 }} />
                                        <Input placeholder="请输入联系电话" style={{ flex: 1 }} />
                                    </div>
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item label="项目组织证明材料">
                                    <Upload beforeUpload={() => false} maxCount={1}>
                                        <Button icon={<UploadOutlined />}>点击上传</Button>
                                    </Upload>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </div>

                {/* 合同签订 */}
                <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Text strong>合同签订</Text>
                        <Button shape="circle" size="small" icon={<PlusOutlined />} onClick={handleAddContract}
                            style={{ borderColor: '#1677ff', color: '#1677ff' }} />
                        <Button shape="circle" size="small" icon={<MinusOutlined />} onClick={handleDeleteContracts}
                            style={{ borderColor: '#e60012', color: '#e60012' }} />
                    </div>
                    <Table<ContractRecord>
                        columns={contractColumns}
                        dataSource={contracts}
                        rowKey="id"
                        size="small"
                        pagination={false}
                        rowSelection={{
                            selectedRowKeys: selectedContractKeys,
                            onChange: (keys) => setSelectedContractKeys(keys as string[]),
                        }}
                        scroll={{ x: 730 }}
                        locale={{ emptyText: '暂无数据' }}
                    />
                </div>

                {/* 项目节点时间 */}
                <div>
                    <Text strong style={{ marginBottom: 8, display: 'block' }}>项目节点时间</Text>
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 110px 1fr', gap: '8px 0' }}>
                        <div style={{ gridColumn: '1 / -1', background: '#fafafa', padding: '4px 8px', fontSize: 13, display: 'flex', alignItems: 'center' }}>相关节点</div>
                        <div style={{ background: '#fafafa', padding: '4px 8px', fontSize: 13, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>项目启动时间</div>
                        <div style={{ padding: '4px 8px' }}><DatePicker size="small" placeholder="请选择" style={{ width: '100%' }} /></div>
                        <div style={{ background: '#fafafa', padding: '4px 8px', fontSize: 13, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>项目结束时间</div>
                        <div style={{ padding: '4px 8px' }}><DatePicker size="small" placeholder="请选择" style={{ width: '100%' }} /></div>
                        {(['周报', '需求确认', '方案设计', '测试', '预验收', '最终验收'] as const).map(name => (
                            <React.Fragment key={name}>
                                <div style={{ background: '#fafafa', padding: '4px 8px', fontSize: 13, display: 'flex', alignItems: 'center' }}>{name}</div>
                                <div style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>计划完成时间</Text>
                                    <DatePicker size="small" placeholder="请选择" style={{ width: 140 }} />
                                </div>
                                <div style={{ background: '#fafafa', padding: '4px 8px', fontSize: 13, display: 'flex', alignItems: 'center' }}>负责人</div>
                                <div style={{ padding: '4px 8px' }}><Input size="small" placeholder="请输入" style={{ width: 150 }} /></div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* 备注 */}
                <div style={{ marginTop: 12 }}>
                    <Text type="danger" style={{ fontSize: 12 }}>备注: {node.remark}</Text>
                </div>
            </Card>
        </div>
    );
}

// ============ 普通节点内容（周报/需求确认/方案设计/测试/预验收/最终验收）============

function RegularNodeContent({ node }: { node: ExecutionNodeRecord }) {
    const templates = NODE_TEMPLATES[node.name] || [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 模板下载 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text>模板下载:</Text>
                {templates.map((tpl, i) => (
                    <Button key={i} size="small" icon={<DownloadOutlined />} style={{ fontSize: 12 }}>{tpl}</Button>
                ))}
                {templates.length === 0 && <Text type="secondary">-</Text>}
            </div>

            {/* 上传附件 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text>上传附件:</Text>
                <Upload beforeUpload={() => false} maxCount={5}>
                    <Button size="small" icon={<UploadOutlined />}>请选择</Button>
                </Upload>
            </div>

            {/* 备注 */}
            <div>
                <Text>备注:</Text> <Text type="danger" style={{ fontSize: 12 }}>{node.remark}</Text>
            </div>
        </div>
    );
}
