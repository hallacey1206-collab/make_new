/**
 * 企微端备案审批消息详情 H5 页面
 * 与 PC 端保持一致：3 个 Tab（基本信息/节点配置/审批信息）
 * 完整表单字段 + 节点配置 + 专家评审 + 审批记录 + 底部操作按钮
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Alert,
    AutoComplete,
    Button,
    Card,
    Drawer,
    Empty,
    Input,
    message,
    Modal,
    Select,
    Space,
    Tag,
    Timeline,
    Tree,
    Typography,
    Upload,
} from 'antd';
import type { UploadProps } from 'antd';
import type { TreeDataNode } from 'antd';
import {
    CheckCircleFilled,
    CheckCircleOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    DownOutlined,
    HolderOutlined,
    LeftOutlined,
    PaperClipOutlined,
    PlusOutlined,
    RollbackOutlined,
    RightOutlined,
    SendOutlined,
    TeamOutlined,
    UpOutlined,
    UploadOutlined,
    UserOutlined,
} from '@ant-design/icons';

import Sortable from 'sortablejs';

import { orgTreeData } from './data';

const { Text, Title, Paragraph } = Typography;

// ============ 类型定义 ============

type FilingStatus = 'pending-review' | 'expert-reviewing' | 'returned' | 'approved-level1' | 'approved';
type ProjectLevel = 'normal' | 'key';
type ExpertType = 'expert' | 'business-domain';

interface ExecutionNode {
    id: string;
    name: string;
    description: string;
    nodeType: 'apply' | 'review';
    order: number;
    materials: string[];
    templates?: string[];
    isFromTemplate?: boolean;
}

interface ApprovalHistory {
    id: string;
    reviewer: string;
    reviewerOrg: string;
    action: 'submit' | 'expert-assign' | 'approve' | 'return';
    remark?: string;
    time: string;
    level: number;
}

interface ExpertOpinion {
    id: string;
    expertName: string;
    expertType: ExpertType;
    expertOrg: string;
    opinion?: string;
    submitTime?: string;
    status: 'pending' | 'submitted';
}

interface FilingAttachment {
    id: string;
    name: string;
    size: string;
    uploadTime: string;
    category: 'filing-doc' | 'expert-review-doc';
}

interface FilingRecord {
    id: string;
    code: string;
    filingDate: string;
    projectName: string;
    orgName: string;
    applicant: string;
    contactPhone: string;
    projectLevel: ProjectLevel;
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
    startDate: string;
    endDate: string;
    submitTime: string;
    submitter: string;
    status: FilingStatus;
    nodes: ExecutionNode[];
    experts: ExpertOpinion[];
    approvalHistory: ApprovalHistory[];
    attachments: FilingAttachment[];
    hasExpertReviewDoc: boolean;
    reviewLevel: number;
}

// ============ 常量数据 ============

const NODE_TEMPLATES: Record<string, ExecutionNode[]> = {
    key: [
        { id: 'k1', name: '项目立项（申请）', description: '', nodeType: 'apply', order: 1, materials: [] },
        { id: 'k2', name: '项目立项（审核）', description: '', nodeType: 'review', order: 2, materials: [] },
        { id: 'k3', name: '项目启动', description: '', nodeType: 'apply', order: 3, materials: [] },
        { id: 'k4', name: '周报', description: '', nodeType: 'apply', order: 4, materials: [] },
        { id: 'k5', name: '需求确认', description: '', nodeType: 'apply', order: 5, materials: [] },
        { id: 'k6', name: '方案设计', description: '', nodeType: 'apply', order: 6, materials: [] },
        { id: 'k7', name: '测试', description: '', nodeType: 'apply', order: 7, materials: [] },
        { id: 'k8', name: '预验收', description: '', nodeType: 'review', order: 8, materials: [] },
        { id: 'k9', name: '最终验收', description: '', nodeType: 'review', order: 9, materials: [] },
        { id: 'k10', name: '最终验收审核', description: '', nodeType: 'review', order: 10, materials: [] },
    ],
    normal: [
        { id: 'n1', name: '项目启动', description: '', nodeType: 'apply', order: 1, materials: [] },
        { id: 'n2', name: '周报', description: '', nodeType: 'apply', order: 2, materials: [] },
        { id: 'n3', name: '最终验收', description: '', nodeType: 'review', order: 3, materials: [] },
        { id: 'n4', name: '最终验收审核', description: '', nodeType: 'review', order: 4, materials: [] },
    ],
};

const NODE_NAME_OPTIONS = [
    '项目立项（申请）', '项目立项（审核）', '项目启动', '周报', '需求确认',
    '方案设计', '测试', '预验收', '最终验收', '最终验收审核',
];

const MATERIAL_OPTIONS = [
    { value: 'filing-application', label: '立项申请书' },
    { value: 'feasibility-report', label: '可行性研究报告' },
    { value: 'budget-detail', label: '预算明细表' },
    { value: 'technical-plan', label: '技术方案' },
    { value: 'test-report', label: '测试报告' },
    { value: 'acceptance-report', label: '验收报告' },
];

const EXPERT_POOL = [
    { name: '张明远', org: '中国建材总院', type: 'expert' as ExpertType, specialty: '技术架构', majorYears: 12 },
    { name: '李建华', org: '中材国际', type: 'expert' as ExpertType, specialty: '应用架构', majorYears: 8 },
    { name: '王建国', org: '凯盛科技', type: 'expert' as ExpertType, specialty: '数据架构', majorYears: 10 },
    { name: '赵文博', org: '中国巨石', type: 'expert' as ExpertType, specialty: '信息安全', majorYears: 15 },
    { name: '陈志强', org: '中材科技', type: 'expert' as ExpertType, specialty: '数字化治理', majorYears: 9 },
    { name: '刘伟', org: '中材国际', type: 'business-domain' as ExpertType, specialty: '业务架构', majorYears: 11 },
    { name: '孙丽', org: '中国建材总院', type: 'business-domain' as ExpertType, specialty: '人工智能', majorYears: 6 },
    { name: '周涛', org: '凯盛科技', type: 'business-domain' as ExpertType, specialty: '业务架构', majorYears: 7 },
    { name: '吴芳', org: '中建材投资', type: 'business-domain' as ExpertType, specialty: '数字化治理', majorYears: 13 },
    { name: '郑强', org: '天山材料', type: 'business-domain' as ExpertType, specialty: '应用架构', majorYears: 5 },
];

// 组织架构树（含人员节点），用于业务域人员选择
const ORG_TREE_WITH_PERSONS: TreeDataNode[] = [
    {
        title: '集团总部', key: 'group',
        children: [
            {
                title: '中材国际', key: '06',
                children: [
                    {
                        title: '中材国际（南京）', key: '06-01',
                        children: [
                            { title: <span><UserOutlined style={{ marginRight: 4, color: '#1677ff' }} />张工</span>, key: 'person-zhang' },
                            { title: <span><UserOutlined style={{ marginRight: 4, color: '#1677ff' }} />李工</span>, key: 'person-li' },
                        ],
                    },
                    {
                        title: '中国建材装备集团', key: '06-02',
                        children: [
                            { title: <span><UserOutlined style={{ marginRight: 4, color: '#1677ff' }} />周工</span>, key: 'person-zhou' },
                        ],
                    },
                    {
                        title: '合肥装备科技', key: '06-03',
                        children: [
                            { title: <span><UserOutlined style={{ marginRight: 4, color: '#1677ff' }} />王工</span>, key: 'person-wang' },
                        ],
                    },
                    {
                        title: '合肥水泥研究院', key: '06-04',
                        children: [
                            { title: <span><UserOutlined style={{ marginRight: 4, color: '#1677ff' }} />赵工</span>, key: 'person-zhao' },
                        ],
                    },
                ],
            },
            {
                title: '中国建材总院', key: '09',
                children: [
                    { title: <span><UserOutlined style={{ marginRight: 4, color: '#1677ff' }} />孙丽</span>, key: 'person-sun' },
                    { title: <span><UserOutlined style={{ marginRight: 4, color: '#1677ff' }} />张明远</span>, key: 'person-zhangmy' },
                ],
            },
            {
                title: '凯盛科技', key: '11',
                children: [
                    { title: <span><UserOutlined style={{ marginRight: 4, color: '#1677ff' }} />周涛</span>, key: 'person-zhoutao' },
                    { title: <span><UserOutlined style={{ marginRight: 4, color: '#1677ff' }} />王建国</span>, key: 'person-wangjg' },
                ],
            },
            {
                title: '中国巨石', key: '15',
                children: [
                    { title: <span><UserOutlined style={{ marginRight: 4, color: '#1677ff' }} />赵文博</span>, key: 'person-zhaowb' },
                ],
            },
            {
                title: '中建材投资', key: '07',
                children: [
                    { title: <span><UserOutlined style={{ marginRight: 4, color: '#1677ff' }} />吴芳</span>, key: 'person-wufang' },
                ],
            },
            {
                title: '天山材料', key: '16',
                children: [
                    { title: <span><UserOutlined style={{ marginRight: 4, color: '#1677ff' }} />郑强</span>, key: 'person-zhengq' },
                ],
            },
        ],
    },
];

// 人员 key -> 名称映射
const PERSON_NAME_MAP: Record<string, string> = {
    'person-zhang': '张工', 'person-li': '李工', 'person-zhou': '周工',
    'person-wang': '王工', 'person-zhao': '赵工', 'person-sun': '孙丽',
    'person-zhangmy': '张明远', 'person-zhoutao': '周涛', 'person-wangjg': '王建国',
    'person-zhaowb': '赵文博', 'person-wufang': '吴芳', 'person-zhengq': '郑强',
};

// 判断是否为人员节点（key 以 person- 开头）
const isPersonNode = (key: string) => key.startsWith('person-');

const statusMeta: Record<FilingStatus, { label: string; color: string; antdColor: string }> = {
    'pending-review': { label: '待审核', color: '#1677ff', antdColor: 'blue' },
    'expert-reviewing': { label: '专家评审中', color: '#fa8c16', antdColor: 'orange' },
    'returned': { label: '已退回', color: '#ff4d4f', antdColor: 'red' },
    'approved-level1': { label: '业务域评审中', color: '#13c2c2', antdColor: 'cyan' },
    'approved': { label: '已通过', color: '#52c41a', antdColor: 'green' },
};

const PROJECT_LEVEL_OPTIONS = [
    { value: 'key', label: '重点项目' },
    { value: 'normal', label: '普通项目' },
];

const actionLabel: Record<string, string> = {
    submit: '提交',
    'expert-assign': '转专家',
    approve: '通过',
    return: '退回',
};

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

function nowString() {
    const now = new Date();
    const pad = (v: number) => String(v).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

// ============ 模拟备案记录 ============

const currentYear = new Date().getFullYear();

const MOCK_RECORD: FilingRecord = {
    id: 'filing-001',
    code: `${currentYear}_2071139461050580993`,
    filingDate: `${currentYear}-06-28`,
    projectName: '中材南京数字化平台升级项目',
    orgName: '中国中材国际工程股份有限公司',
    applicant: '张工',
    contactPhone: '13800138001',
    projectLevel: 'key',
    isIndependent: '是',
    budgetPlan: '年度计划内',
    budgetCode: '632904-7BLYLX',
    buildLocation: '国内',
    projectType: '系统建设类',
    coverageScope: '覆盖中材国际（南京）全部业务流程，包括生产管理、质量管理、设备管理、供应链管理及行政管理等模块，实现集团-二级-三级企业的数据贯通。',
    hasCrossDomainData: '否',
    isHeadquartersInterface: '否',
    totalInvestment: 350,
    yearBudget: 200,
    totalProjectInvestment: 420,
    selfFunding: 200,
    externalFunding: 100,
    otherFunding: 50,
    brief: '围绕中材国际（南京）现有数字化平台，进行整体升级改造，涵盖ERP、MES和OA系统，提升业务协同效率与数据贯通能力。',
    buildMode: '单位自建',
    buildType: '优化',
    startDate: `${currentYear}-03-01`,
    endDate: `${currentYear}-12-31`,
    submitTime: `${currentYear}-06-20 10:30`,
    submitter: '张工',
    status: 'pending-review',
    nodes: [...NODE_TEMPLATES.key],
    experts: [],
    approvalHistory: [
        { id: 'ah-001', reviewer: '张工', reviewerOrg: '中材国际（南京）', action: 'submit', remark: '项目备案材料已提交，请审核。', time: `${currentYear}-06-20 10:30`, level: 1 },
    ],
    attachments: [
        { id: 'att-001', name: '项目立项备案表.pdf', size: '2.3 MB', uploadTime: `${currentYear}-06-20 10:25`, category: 'filing-doc' },
        { id: 'att-002', name: '项目可行性研究报告.pdf', size: '5.1 MB', uploadTime: `${currentYear}-06-20 10:28`, category: 'filing-doc' },
    ],
    hasExpertReviewDoc: false,
    reviewLevel: 1,
};

// ============ H5 详情页 ============

export default function FilingWecomDetailPage() {
    const [record, setRecord] = useState<FilingRecord>({ ...MOCK_RECORD, nodes: [...MOCK_RECORD.nodes], experts: [...MOCK_RECORD.experts], approvalHistory: [...MOCK_RECORD.approvalHistory], attachments: [...MOCK_RECORD.attachments] });
    const [activeTab, setActiveTab] = useState<'basic' | 'nodes' | 'approval'>('basic');
    const [projectLevel, setProjectLevel] = useState<ProjectLevel>(record.projectLevel);
    const [nodes, setNodes] = useState<ExecutionNode[]>([...record.nodes]);
    const [expertModalOpen, setExpertModalOpen] = useState(false);
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [returnRemark, setReturnRemark] = useState('');
    const [expertOpinion, setExpertOpinion] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<FilingAttachment[]>([...record.attachments]);
    const [selectedExperts, setSelectedExperts] = useState<Set<string>>(new Set());
    const [expertTab, setExpertTab] = useState<'expert' | 'business-domain'>('expert');
    const [selectedOrgKeys, setSelectedOrgKeys] = useState<string[]>([]);
    const [materialPickerOpen, setMaterialPickerOpen] = useState(false);
    const [materialPickerNodeId, setMaterialPickerNodeId] = useState<string>('');
    const [materialPickerSelected, setMaterialPickerSelected] = useState<string[]>([]);
    const nodeSortRef = useRef<HTMLDivElement>(null);
    const sortableRef = useRef<Sortable | null>(null);

    const isReviewing = record.status === 'pending-review' || record.status === 'expert-reviewing';
    const isExpertReviewing = record.status === 'expert-reviewing' || record.status === 'approved-level1';

    // ============ 操作处理 ============

    const handleAddNode = () => {
        const newNode: ExecutionNode = { id: genId(), name: '', description: '', nodeType: 'apply', order: nodes.length + 1, materials: [] };
        setNodes([...nodes, newNode]);
    };

    const handleRemoveNode = (nodeId: string) => {
        setNodes(nodes.filter(n => n.id !== nodeId).map((n, i) => ({ ...n, order: i + 1 })));
    };

    const handleNodeNameChange = (nodeId: string, name: string) => {
        setNodes(nodes.map(n => n.id === nodeId ? { ...n, name } : n));
    };

    const handleNodeDescriptionChange = (nodeId: string, description: string) => {
        setNodes(nodes.map(n => n.id === nodeId ? { ...n, description } : n));
    };

    // SortableJS 拖拽排序初始化
    const initSortable = useCallback(() => {
        if (sortableRef.current) {
            sortableRef.current.destroy();
            sortableRef.current = null;
        }
        if (!isReviewing || !nodeSortRef.current) return;
        sortableRef.current = Sortable.create(nodeSortRef.current, {
            animation: 200,
            handle: '.wecom-node-drag-handle',
            ghostClass: 'wecom-node-ghost',
            onEnd: (evt) => {
                const { oldIndex, newIndex } = evt;
                if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;
                setNodes(prev => {
                    const arr = [...prev];
                    const [moved] = arr.splice(oldIndex, 1);
                    arr.splice(newIndex, 0, moved);
                    return arr.map((n, i) => ({ ...n, order: i + 1 }));
                });
            },
        });
    }, [isReviewing]);

    useEffect(() => {
        initSortable();
        return () => {
            if (sortableRef.current) {
                sortableRef.current.destroy();
                sortableRef.current = null;
            }
        };
    }, [initSortable, nodes.length]);

    // 打开材料选择器
    const openMaterialPicker = (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        setMaterialPickerNodeId(nodeId);
        setMaterialPickerSelected(node?.materials || []);
        setMaterialPickerOpen(true);
    };

    const handleMaterialPickerConfirm = () => {
        setNodes(nodes.map(n => n.id === materialPickerNodeId ? { ...n, materials: materialPickerSelected } : n));
        setMaterialPickerOpen(false);
    };

    const handleSaveNodes = () => {
        if (nodes.some(n => !n.name.trim())) {
            message.warning('请填写所有节点名称');
            return;
        }
        setRecord({ ...record, nodes: [...nodes], projectLevel });
        message.success('节点配置已保存');
    };

    const handleExpertConfirm = () => {
        if (selectedExperts.size === 0) {
            message.warning('请选择至少一位专家');
            return;
        }
        const selectedList = EXPERT_POOL.filter(e => selectedExperts.has(e.name));
        const newExperts: ExpertOpinion[] = selectedList.map(e => ({
            id: genId(), expertName: e.name, expertType: e.type, expertOrg: e.org, status: 'pending' as const,
        }));
        const newHistory: ApprovalHistory = {
            id: genId(), reviewer: '管理员', reviewerOrg: '集团总部', action: 'expert-assign',
            remark: `指派专家：${selectedList.map(e => e.name).join('、')}`, time: nowString(), level: record.reviewLevel,
        };
        setRecord({ ...record, experts: newExperts, approvalHistory: [...record.approvalHistory, newHistory], status: 'expert-reviewing', reviewLevel: record.reviewLevel + 1 });
        setExpertModalOpen(false);
        setSelectedExperts(new Set());
        message.success(`已指派 ${selectedList.map(e => e.name).join('、')} 进行评审`);
    };

    const handleBusinessDomainConfirm = () => {
        if (selectedOrgKeys.length === 0) {
            message.warning('请选择至少一位业务域人员');
            return;
        }
        const personNames = selectedOrgKeys.map(k => PERSON_NAME_MAP[k] || k);
        const newExperts: ExpertOpinion[] = selectedOrgKeys.map(k => ({
            id: genId(),
            expertName: PERSON_NAME_MAP[k] || k,
            expertType: 'business-domain' as const,
            expertOrg: '', // 组织信息由树结构隐含
            status: 'pending' as const,
        }));
        const newHistory: ApprovalHistory = {
            id: genId(), reviewer: '管理员', reviewerOrg: '集团总部', action: 'expert-assign',
            remark: `指派业务域人员：${personNames.join('、')}`, time: nowString(), level: record.reviewLevel,
        };
        setRecord({ ...record, experts: [...record.experts, ...newExperts], approvalHistory: [...record.approvalHistory, newHistory], status: 'approved-level1', reviewLevel: record.reviewLevel + 1 });
        setExpertModalOpen(false);
        setSelectedOrgKeys([]);
        setExpertTab('expert');
        message.success(`已指派 ${personNames.join('、')} 进行业务域评审`);
    };

    const handleApprove = () => {
        const nextStatus: FilingStatus = record.status === 'pending-review' ? 'approved-level1' : 'approved';
        const newHistory: ApprovalHistory = { id: genId(), reviewer: '管理员', reviewerOrg: '集团总部', action: 'approve', time: nowString(), level: record.reviewLevel };
        setRecord({ ...record, status: nextStatus, reviewLevel: record.reviewLevel + 1, approvalHistory: [...record.approvalHistory, newHistory], nodes: [...nodes], projectLevel });
        message.success('审批通过');
    };

    const handleReturnConfirm = () => {
        if (!returnRemark.trim()) { message.warning('请填写退回原因'); return; }
        const newHistory: ApprovalHistory = { id: genId(), reviewer: '管理员', reviewerOrg: '集团总部', action: 'return', remark: returnRemark, time: nowString(), level: record.reviewLevel };
        setRecord({ ...record, status: 'returned', approvalHistory: [...record.approvalHistory, newHistory] });
        setReturnModalOpen(false);
        setReturnRemark('');
    };

    const handleExpertOpinionSubmit = () => {
        if (!expertOpinion.trim()) { message.warning('请填写评审意见'); return; }
        message.success('评审意见已提交');
        setExpertOpinion('');
    };

    // Upload props
    const uploadProps: UploadProps = {
        name: 'file', multiple: true, showUploadList: true,
        beforeUpload: (file) => {
            const exists = uploadedFiles.some(f => f.name === file.name);
            if (exists) { message.warning(`文件 "${file.name}" 已存在`); return Upload.LIST_IGNORE; }
            const newFile: FilingAttachment = { id: genId(), name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} MB`, uploadTime: nowString(), category: 'expert-review-doc' };
            setUploadedFiles(prev => [...prev, newFile]);
            message.success(`${file.name} 上传成功`);
            return false;
        },
        onRemove: (file) => { setUploadedFiles(prev => prev.filter(f => f.name !== file.name)); },
    };

    // ============ 渲染辅助 ============

    const infoRow = (label: string, value: React.ReactNode) => (
        <div className="wecom-detail-info-row">
            <Text type="secondary" style={{ fontSize: 13 }}>{label}</Text>
            {typeof value === 'string' ? <Text style={{ fontSize: 14 }}>{value}</Text> : value}
        </div>
    );

    const infoRowFull = (label: string, value: React.ReactNode) => (
        <div style={{ padding: '0 16px 10px' }}>
            <Text type="secondary" style={{ fontSize: 13 }}>{label}</Text>
            <div style={{ fontSize: 14, lineHeight: 1.6, marginTop: 2, color: 'rgba(0,0,0,0.88)' }}>{value}</div>
        </div>
    );

    // ============ Tab 内容 ============

    const renderBasicTab = () => (
        <div style={{ paddingBottom: 12 }}>
            {/* 顶部：申请单位 / 备案号 / 日期 */}
            <div style={{ padding: '10px 16px', background: '#fafafa', borderRadius: 8, margin: '8px 12px', border: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: 13 }}>
                    <span><Text type="secondary">申请单位：</Text>{record.orgName}</span>
                    <span><Text type="secondary">备案号：</Text><code style={{ fontSize: 12 }}>{record.code}</code></span>
                    <span><Text type="secondary">日期：</Text>{record.filingDate}</span>
                </div>
            </div>

            {/* 项目基本情况 */}
            <div className="wecom-detail-section">
                <div className="wecom-detail-section-title"><Text strong style={{ fontSize: 15 }}>项目基本情况</Text></div>
                <div className="wecom-detail-info-grid">
                    {infoRow('项目立项人', record.applicant)}
                    {infoRow('联系方式', record.contactPhone)}
                    {infoRow('独立/非独立', record.isIndependent)}
                    {infoRow('项目预算计划', record.budgetPlan)}
                    {infoRow('预算编号', <code style={{ fontSize: 12 }}>{record.budgetCode}</code>)}
                    {infoRow('项目建设地点', record.buildLocation)}
                    {infoRow('项目级别', (
                        <Select value={projectLevel} style={{ width: 120 }} size="small" options={PROJECT_LEVEL_OPTIONS}
                            onChange={(v: ProjectLevel) => {
                                setProjectLevel(v);
                                const template = NODE_TEMPLATES[v];
                                if (template) setNodes(template.map((t, i) => ({ ...t, id: genId(), isFromTemplate: true })));
                            }}
                        />
                    ))}
                    {infoRow('项目类型', record.projectType)}
                    {infoRow('建设模式', record.buildMode)}
                    {infoRow('建设类型', record.buildType)}
                    {infoRow('是否有跨域数据权限', record.hasCrossDomainData)}
                    {infoRow('是否总部接口', record.isHeadquartersInterface)}
                </div>
                {infoRowFull('项目名称', record.projectName)}
                {infoRowFull('项目覆盖范围', record.coverageScope)}
                {infoRowFull('主要建设内容', record.brief)}
                <div className="wecom-detail-info-grid">
                    {infoRow('计划开始建设时间', record.startDate)}
                    {infoRow('计划结束建设时间', record.endDate)}
                    {infoRow('计划建设工期', `${computeMonths(record.startDate, record.endDate)} 个月`)}
                </div>
            </div>

            {/* 项目投入情况 */}
            <div className="wecom-detail-section">
                <div className="wecom-detail-section-title"><Text strong style={{ fontSize: 15 }}>项目投入情况</Text></div>
                <div className="wecom-detail-info-grid">
                    {infoRow('当年预算(万元)', <span style={{ fontWeight: 500, color: '#e60012' }}>¥{formatMoney(record.yearBudget)}</span>)}
                    {infoRow('预算总额(万元)', <span style={{ fontWeight: 500 }}>¥{formatMoney(record.totalInvestment)}</span>)}
                    {infoRow('项目总投资(万元)', <span style={{ fontWeight: 500 }}>¥{formatMoney(record.totalProjectInvestment)}</span>)}
                    {infoRow('自有资金(万元)', <span style={{ fontWeight: 500 }}>¥{formatMoney(record.selfFunding)}</span>)}
                    {infoRow('外部资金(万元)', <span style={{ fontWeight: 500 }}>¥{formatMoney(record.externalFunding)}</span>)}
                    {infoRow('其他资金(万元)', <span style={{ fontWeight: 500 }}>¥{formatMoney(record.otherFunding)}</span>)}
                </div>
            </div>

            {/* 附件 */}
            <div className="wecom-detail-section">
                <div className="wecom-detail-section-title"><Text strong style={{ fontSize: 15 }}>附件</Text></div>
                <div style={{ padding: '0 16px 12px' }}>
                    <div className="wecom-attachment-list">
                        <div style={{ marginBottom: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>解决方案文档/可行性研究报告</Text>
                            <div style={{ marginTop: 4 }}>
                                <Tag icon={<PaperClipOutlined />} color="blue" style={{ cursor: 'pointer', fontSize: 12 }}>项目立项意见.pdf</Tag>
                            </div>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>架构看护文档</Text>
                            <div style={{ marginTop: 4 }}>
                                <Tag icon={<PaperClipOutlined />} color="blue" style={{ cursor: 'pointer', fontSize: 12 }}>项目立项建议书.pdf</Tag>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderNodesTab = () => (
        <div style={{ paddingBottom: 12 }}>
            <div className="wecom-detail-section">
                <div className="wecom-detail-section-title" style={{ flexWrap: 'wrap', gap: 8 }}>
                    <Text strong style={{ fontSize: 15 }}>项目执行节点</Text>
                    {isReviewing && (
                        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
                            <Select
                                placeholder="选择预设模板" style={{ width: 130 }} size="small"
                                options={[
                                    { value: 'key', label: '重点项目节点' },
                                    { value: 'normal', label: '普通项目节点' },
                                ]}
                                onChange={(value: string) => {
                                    if (NODE_TEMPLATES[value]) {
                                        setNodes(NODE_TEMPLATES[value].map((t, i) => ({ ...t, id: genId(), order: i + 1, isFromTemplate: true })));
                                        setProjectLevel(value as ProjectLevel);
                                        message.success('已加载预设节点模板');
                                    }
                                }}
                                value={undefined as any}
                            />
                            <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={handleAddNode}>添加节点</Button>
                            <Button type="primary" size="small" onClick={handleSaveNodes}>保存节点配置</Button>
                        </div>
                    )}
                </div>
                <div style={{ padding: '0 0 8px' }}>
                    {nodes.length === 0 ? (
                        <Empty description="暂无节点" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    ) : (
                        <div className="wecom-node-list" ref={nodeSortRef}>
                            {nodes.map((node, index) => (
                                <div key={node.id} className="wecom-node-item" data-id={node.id}>
                                    {isReviewing && (
                                        <div className="wecom-node-drag-handle">
                                            <HolderOutlined style={{ fontSize: 14, color: '#999' }} />
                                        </div>
                                    )}
                                    <div className="wecom-node-order">{index + 1}</div>
                                    <div className="wecom-node-content" style={{ flex: 1 }}>
                                        {isReviewing ? (
                                            <AutoComplete
                                                value={node.name}
                                                options={NODE_NAME_OPTIONS.map(n => ({ value: n, label: n }))}
                                                onChange={(v) => handleNodeNameChange(node.id, v)}
                                                placeholder="节点名称" style={{ width: '100%' }} size="small"
                                                filterOption={(input, option) => (option?.value || '').toUpperCase().indexOf(input.toUpperCase()) !== -1}
                                            />
                                        ) : (
                                            <Text style={{ fontSize: 14 }}>{node.name}</Text>
                                        )}
                                        {/* 节点描述 */}
                                        {isReviewing ? (
                                            <Input.TextArea
                                                value={node.description}
                                                onChange={(e) => handleNodeDescriptionChange(node.id, e.target.value)}
                                                placeholder="节点描述（选填）"
                                                rows={2}
                                                maxLength={200}
                                                showCount
                                                style={{ marginTop: 6, fontSize: 12 }}
                                            />
                                        ) : (
                                            node.description && (
                                                <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(0,0,0,0.45)', lineHeight: 1.5 }}>
                                                    {node.description}
                                                </div>
                                            )
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                                            <Tag color={node.nodeType === 'apply' ? 'blue' : 'orange'} style={{ fontSize: 11, lineHeight: '16px', padding: '0 4px' }}>
                                                {node.nodeType === 'apply' ? '申请' : '审核'}
                                            </Tag>
                                            {/* 移动端弹出选择器 */}
                                            {isReviewing && (
                                                <div
                                                    className="wecom-material-picker-trigger"
                                                    onClick={() => openMaterialPicker(node.id)}
                                                >
                                                    <Text type="secondary" style={{ fontSize: 12 }}>所需材料</Text>
                                                    {(node.materials || []).length > 0 && (
                                                        <Tag color="blue" style={{ fontSize: 11, lineHeight: '16px', padding: '0 4px', marginLeft: 4 }}>
                                                            {(node.materials || []).length}项
                                                        </Tag>
                                                    )}
                                                    <RightOutlined style={{ fontSize: 10, color: '#ccc', marginLeft: 2 }} />
                                                </div>
                                            )}
                                            {!isReviewing && (node.materials || []).length > 0 && (
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    {(node.materials || []).map(m => MATERIAL_OPTIONS.find(o => o.value === m)?.label || m).join('、')}
                                                </Text>
                                            )}
                                        </div>
                                        {/* 材料模板上传 */}
                                        {isReviewing && (
                                            <div style={{ marginTop: 6 }}>
                                                <Upload
                                                    {...{
                                                        name: 'file', multiple: false, showUploadList: true,
                                                        beforeUpload: (file: any) => {
                                                            const templates = node.templates || [];
                                                            setNodes(nodes.map(n => n.id === node.id ? { ...n, templates: [...templates, file.name] } : n));
                                                            message.success(`${file.name} 已添加为模板`);
                                                            return false;
                                                        },
                                                        onRemove: (file: any) => {
                                                            const templates = (node.templates || []).filter(t => t !== file.name);
                                                            setNodes(nodes.map(n => n.id === node.id ? { ...n, templates } : n));
                                                        },
                                                        fileList: (node.templates || []).map((t, i) => ({ uid: `${node.id}-tpl-${i}`, name: t, status: 'done' as const })),
                                                    }}
                                                    size="small"
                                                >
                                                    <Button type="dashed" size="small" icon={<UploadOutlined />} style={{ fontSize: 11 }}>
                                                        上传模板
                                                    </Button>
                                                </Upload>
                                            </div>
                                        )}
                                        {!isReviewing && (node.templates || []).length > 0 && (
                                            <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                {(node.templates || []).map((t, i) => (
                                                    <Tag key={i} icon={<PaperClipOutlined />} color="blue" style={{ fontSize: 11, cursor: 'pointer' }}>{t}</Tag>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {/* 删除按钮 */}
                                    {isReviewing && (
                                        <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => handleRemoveNode(node.id)} style={{ flexShrink: 0, marginTop: 2 }} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderApprovalTab = () => (
        <div style={{ paddingBottom: 12 }}>
            {/* 技术专家评审意见 */}
            {record.experts.filter(e => e.expertType === 'expert').length > 0 && (
                <div className="wecom-detail-section">
                    <div className="wecom-detail-section-title"><Text strong style={{ fontSize: 15 }}>技术专家评审意见</Text></div>
                    <div style={{ padding: '0 12px 12px' }}>
                        <Space direction="vertical" style={{ width: '100%' }} size={10}>
                            {record.experts.filter(e => e.expertType === 'expert').map(expert => (
                                <div key={expert.id} style={{
                                    padding: 10, borderRadius: 8,
                                    background: expert.status === 'submitted' ? '#f6ffed' : '#fffbe6',
                                    border: `1px solid ${expert.status === 'submitted' ? '#b7eb8f' : '#ffe58f'}`,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <Space size={6}>
                                            <UserOutlined style={{ fontSize: 14 }} />
                                            <Text strong style={{ fontSize: 14 }}>{expert.expertName}</Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{expert.expertOrg}</Text>
                                        </Space>
                                        <Tag color={expert.status === 'submitted' ? 'success' : 'processing'} style={{ fontSize: 11 }}>
                                            {expert.status === 'submitted' ? '已提交' : '待提交'}
                                        </Tag>
                                    </div>
                                    {expert.status === 'submitted' && expert.opinion ? (
                                        <div style={{ padding: '6px 10px', background: '#fff', borderRadius: 6, border: '1px solid #f0f0f0', fontSize: 13, lineHeight: 1.6 }}>
                                            <Text type="secondary" style={{ fontSize: 11 }}>评审意见：</Text>
                                            <div style={{ marginTop: 2 }}>{expert.opinion}</div>
                                            <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>提交时间：{expert.submitTime}</div>
                                        </div>
                                    ) : (
                                        <Text type="secondary" style={{ fontSize: 12 }}>等待提交评审意见...</Text>
                                    )}
                                </div>
                            ))}
                        </Space>
                    </div>
                </div>
            )}

            {/* 业务域评审意见 */}
            {record.experts.filter(e => e.expertType === 'business-domain').length > 0 && (
                <div className="wecom-detail-section">
                    <div className="wecom-detail-section-title"><Text strong style={{ fontSize: 15 }}>业务域评审意见</Text></div>
                    <div style={{ padding: '0 12px 12px' }}>
                        <Space direction="vertical" style={{ width: '100%' }} size={10}>
                            {record.experts.filter(e => e.expertType === 'business-domain').map(expert => (
                                <div key={expert.id} style={{
                                    padding: 10, borderRadius: 8,
                                    background: expert.status === 'submitted' ? '#f6ffed' : '#fffbe6',
                                    border: `1px solid ${expert.status === 'submitted' ? '#b7eb8f' : '#ffe58f'}`,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <Space size={6}>
                                            <UserOutlined style={{ fontSize: 14 }} />
                                            <Text strong style={{ fontSize: 14 }}>{expert.expertName}</Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{expert.expertOrg}</Text>
                                        </Space>
                                        <Tag color={expert.status === 'submitted' ? 'success' : 'processing'} style={{ fontSize: 11 }}>
                                            {expert.status === 'submitted' ? '已提交' : '待提交'}
                                        </Tag>
                                    </div>
                                    {expert.status === 'submitted' && expert.opinion ? (
                                        <div style={{ padding: '6px 10px', background: '#fff', borderRadius: 6, border: '1px solid #f0f0f0', fontSize: 13, lineHeight: 1.6 }}>
                                            <Text type="secondary" style={{ fontSize: 11 }}>评审意见：</Text>
                                            <div style={{ marginTop: 2 }}>{expert.opinion}</div>
                                            <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>提交时间：{expert.submitTime}</div>
                                        </div>
                                    ) : (
                                        <Text type="secondary" style={{ fontSize: 12 }}>等待提交评审意见...</Text>
                                    )}
                                </div>
                            ))}
                        </Space>
                    </div>
                </div>
            )}

            {/* 审批记录 */}
            <div className="wecom-detail-section">
                <div className="wecom-detail-section-title"><Text strong style={{ fontSize: 15 }}>审批记录</Text></div>
                <div style={{ padding: '8px 12px 12px' }}>
                    {record.approvalHistory.length === 0 ? (
                        <Empty description="暂无审批记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    ) : (
                        <Timeline items={[
                            ...record.approvalHistory.map(h => ({
                                color: h.action === 'return' ? 'red' : h.action === 'approve' ? 'green' : h.action === 'expert-assign' ? 'orange' : 'blue',
                                children: (
                                    <div key={h.id}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                            <Text strong style={{ fontSize: 14 }}>{h.reviewer}</Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{h.reviewerOrg}</Text>
                                            <Tag color={h.action === 'approve' ? 'success' : h.action === 'return' ? 'error' : h.action === 'expert-assign' ? 'warning' : 'default'} style={{ fontSize: 11 }}>
                                                {actionLabel[h.action]}
                                            </Tag>
                                        </div>
                                        {h.remark && <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', marginTop: 4, padding: '4px 8px', background: '#f5f5f5', borderRadius: 4 }}>{h.remark}</div>}
                                        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>{h.time}</div>
                                    </div>
                                ),
                            })),
                            ...record.experts.filter(e => e.status === 'submitted').map(exp => ({
                                color: exp.expertType === 'expert' ? 'blue' as const : 'orange' as const,
                                children: (
                                    <div key={exp.id}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                            <Text strong style={{ fontSize: 14 }}>{exp.expertName}</Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{exp.expertOrg}</Text>
                                            <Tag color={exp.expertType === 'expert' ? 'blue' : 'orange'} style={{ fontSize: 11 }}>
                                                {exp.expertType === 'expert' ? '专家评审' : '业务域评审'}
                                            </Tag>
                                        </div>
                                        {exp.opinion && <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', marginTop: 4 }}>{exp.opinion}</div>}
                                        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>{exp.submitTime}</div>
                                    </div>
                                ),
                            })),
                        ]} />
                    )}
                </div>
            </div>
        </div>
    );

    // ============ 底部操作栏 ============

    const renderFooter = () => {
        if (isExpertReviewing) {
            return (
                <div className="wecom-detail-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                    <Input.TextArea value={expertOpinion} onChange={e => setExpertOpinion(e.target.value)}
                        placeholder="请输入评审意见..." rows={3} maxLength={500} showCount />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space size={8}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {record.status === 'expert-reviewing' ? '技术专家评审中，请提交评审意见' : '业务域评审中，请提交评审意见'}
                            </Text>
                            {record.hasExpertReviewDoc && <Text type="secondary" style={{ fontSize: 12 }}>该单位已做过专家评审</Text>}
                        </Space>
                        <Space size={8}>
                            <Button size="small" onClick={() => { window.location.hash = 'page=filing-wecom-msg'; }}>关闭</Button>
                            <Button type="primary" size="small" icon={<SendOutlined />} onClick={handleExpertOpinionSubmit}
                                style={{ background: '#e60012', borderColor: '#e60012' }}>提交评审意见</Button>
                        </Space>
                    </div>
                </div>
            );
        }

        if (isReviewing) {
            return (
                <div className="wecom-detail-footer">
                    <Button className="wecom-footer-btn wecom-footer-btn-expert" icon={<TeamOutlined />} onClick={() => setExpertModalOpen(true)}>
                        {record.experts.length > 0 ? '调整评审人员' : '转专家/业务域审批'}
                    </Button>
                    <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                        {activeTab === 'basic' ? (
                            <>
                                <Button className="wecom-footer-btn" onClick={() => { window.location.hash = 'page=filing-wecom-msg'; }}>关闭</Button>
                                <Button type="primary" className="wecom-footer-btn" onClick={() => setActiveTab('nodes')}
                                    style={{ background: '#e60012', borderColor: '#e60012' }}>下一步</Button>
                            </>
                        ) : (
                            <>
                                <Button className="wecom-footer-btn" danger icon={<RollbackOutlined />} onClick={() => setReturnModalOpen(true)}>退回</Button>
                                <Button type="primary" className="wecom-footer-btn" icon={<CheckCircleOutlined />} onClick={handleApprove}
                                    style={{ background: '#e60012', borderColor: '#e60012' }}>通过</Button>
                            </>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="wecom-detail-footer" style={{ justifyContent: 'flex-end' }}>
                <Button className="wecom-footer-btn" onClick={() => { window.location.hash = 'page=filing-wecom-msg'; }}>关闭</Button>
            </div>
        );
    };

    // ============ 主渲染 ============

    const filteredExperts = EXPERT_POOL.filter(e => e.type === expertTab);

    return (
        <div className="wecom-shell">
            {/* 顶部导航 */}
            <div className="wecom-header">
                <div className="wecom-header-inner">
                    <LeftOutlined className="wecom-header-back" onClick={() => { window.location.hash = 'page=filing-wecom-msg'; }} />
                    <span className="wecom-header-title">备案审核</span>
                    <Space size={6}>
                        <Tag color={statusMeta[record.status].antdColor} style={{ fontSize: 11, lineHeight: '18px', padding: '0 4px' }}>
                            {statusMeta[record.status].label}
                        </Tag>
                        <Tag color={record.projectLevel === 'key' ? 'red' : 'default'} style={{ fontSize: 11, lineHeight: '18px', padding: '0 4px' }}>
                            {record.projectLevel === 'key' ? '重点项目' : '普通项目'}
                        </Tag>
                    </Space>
                </div>
            </div>

            {/* Tab 切换 */}
            <div className="wecom-tabs">
                <div className={`wecom-tab ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>基本信息</div>
                <div className={`wecom-tab ${activeTab === 'nodes' ? 'active' : ''}`} onClick={() => setActiveTab('nodes')}>节点配置</div>
                <div className={`wecom-tab ${activeTab === 'approval' ? 'active' : ''}`} onClick={() => setActiveTab('approval')}>
                    审批信息
                    {record.experts.some(e => e.status === 'submitted') && <span style={{ display: 'inline-block', width: 6, height: 6, background: '#e60012', borderRadius: '50%', marginLeft: 4, verticalAlign: 'middle' }} />}
                </div>
            </div>

            {/* 主体内容 */}
            <div className="wecom-detail-body">
                {activeTab === 'basic' && renderBasicTab()}
                {activeTab === 'nodes' && renderNodesTab()}
                {activeTab === 'approval' && renderApprovalTab()}
            </div>

            {/* 底部操作按钮 */}
            {renderFooter()}

            {/* 专家选择 Drawer */}
            <Drawer
                title="指派专家"
                placement="bottom"
                height="70vh"
                open={expertModalOpen}
                onClose={() => { setExpertModalOpen(false); setSelectedExperts(new Set()); setSelectedOrgKeys([]); setExpertTab('expert'); }}
                styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
            >
                <div style={{ padding: '0 16px' }}>
                    <div className="wecom-expert-tabs">
                        <div className={`wecom-expert-tab ${expertTab === 'expert' ? 'active' : ''}`} onClick={() => setExpertTab('expert')}>专家库</div>
                        <div className={`wecom-expert-tab ${expertTab === 'business-domain' ? 'active' : ''}`} onClick={() => setExpertTab('business-domain')}>业务域人员</div>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {expertTab === 'expert' ? (
                            filteredExperts.map(expert => (
                                <div key={expert.name}
                                    className={`wecom-expert-item ${selectedExperts.has(expert.name) ? 'selected' : ''}`}
                                    onClick={() => {
                                        const next = new Set(selectedExperts);
                                        if (next.has(expert.name)) next.delete(expert.name); else next.add(expert.name);
                                        setSelectedExperts(next);
                                    }}
                                >
                                    <div className="wecom-expert-avatar"><UserOutlined style={{ fontSize: 16, color: '#fff' }} /></div>
                                    <div className="wecom-expert-info">
                                        <Text strong style={{ fontSize: 14 }}>{expert.name}</Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>{expert.org}</Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>{expert.specialty} · {expert.majorYears}年</Text>
                                    </div>
                                    {selectedExperts.has(expert.name) && <CheckCircleFilled style={{ color: '#1677ff', fontSize: 20 }} />}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '8px 0' }}>
                                <Tree
                                    checkable
                                    checkedKeys={selectedOrgKeys}
                                    onCheck={(checked: any) => {
                                        // 只保留人员节点
                                        const keys: string[] = Array.isArray(checked) ? checked : checked.checked || [];
                                        setSelectedOrgKeys(keys.filter((k: string) => isPersonNode(k)));
                                    }}
                                    treeData={ORG_TREE_WITH_PERSONS}
                                    defaultExpandAll
                                    selectable={false}
                                    titleRender={(nodeData) => {
                                        const isPerson = isPersonNode(String(nodeData.key));
                                        return (
                                            <span style={{ cursor: isPerson ? 'pointer' : 'default', color: isPerson ? 'rgba(0,0,0,0.88)' : 'rgba(0,0,0,0.45)' }}>
                                                {nodeData.title as React.ReactNode}
                                            </span>
                                        );
                                    }}
                                />
                            </div>
                        )}
                    </div>
                    <div style={{ padding: '12px 0 16px' }}>
                        <Button block type="primary"
                            disabled={expertTab === 'expert' ? selectedExperts.size === 0 : selectedOrgKeys.length === 0}
                            onClick={() => {
                                if (expertTab === 'expert') {
                                    handleExpertConfirm();
                                } else {
                                    handleBusinessDomainConfirm();
                                }
                            }}
                            style={{ background: '#e60012', borderColor: '#e60012' }}
                        >
                            确认指派（{expertTab === 'expert' ? selectedExperts.size : selectedOrgKeys.length}人）
                        </Button>
                    </div>
                </div>
            </Drawer>

            {/* 退回确认弹窗 */}
            <Modal
                title="退回备案申请"
                open={returnModalOpen}
                onCancel={() => { setReturnModalOpen(false); setReturnRemark(''); }}
                onOk={handleReturnConfirm}
                okText="确认退回"
                okButtonProps={{ danger: true }}
            >
                <Alert type="warning" showIcon message="退回后，申报单位可修改后重新提交。" style={{ marginBottom: 12 }} />
                <div style={{ marginBottom: 8 }}><Text strong>退回原因：</Text></div>
                <Input.TextArea value={returnRemark} onChange={e => setReturnRemark(e.target.value)}
                    placeholder="请填写退回原因和建议..." rows={4} maxLength={500} showCount />
            </Modal>

            {/* 材料选择弹出层（移动端风格） */}
            <Drawer
                title="选择所需材料"
                placement="bottom"
                height="50vh"
                open={materialPickerOpen}
                onClose={() => setMaterialPickerOpen(false)}
                styles={{ body: { padding: 0 } }}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>已选 {materialPickerSelected.length} 项</Text>
                        <Space size={8}>
                            <Button size="small" onClick={() => setMaterialPickerOpen(false)}>取消</Button>
                            <Button type="primary" size="small" onClick={handleMaterialPickerConfirm}
                                style={{ background: '#e60012', borderColor: '#e60012' }}>确认</Button>
                        </Space>
                    </div>
                }
            >
                <div className="wecom-material-picker-list">
                    {MATERIAL_OPTIONS.map(opt => {
                        const checked = materialPickerSelected.includes(opt.value);
                        return (
                            <div
                                key={opt.value}
                                className={`wecom-material-picker-item ${checked ? 'checked' : ''}`}
                                onClick={() => {
                                    setMaterialPickerSelected(prev =>
                                        prev.includes(opt.value)
                                            ? prev.filter(v => v !== opt.value)
                                            : [...prev, opt.value]
                                    );
                                }}
                            >
                                <div className="wecom-material-picker-check">
                                    {checked && <CheckCircleFilled style={{ color: '#e60012', fontSize: 18 }} />}
                                </div>
                                <Text style={{ fontSize: 14, flex: 1 }}>{opt.label}</Text>
                            </div>
                        );
                    })}
                </div>
            </Drawer>
        </div>
    );
}
