import React, { useState, useMemo, useEffect } from 'react';
import {
    AppstoreOutlined,
    ArrowLeftOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    CloudUploadOutlined,
    DeleteOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    EyeOutlined,
    InboxOutlined,
    PaperClipOutlined,
    PlusOutlined,
    ReloadOutlined,
    RollbackOutlined,
    SearchOutlined,
    SendOutlined,
    TeamOutlined,
    UserOutlined,
    UserSwitchOutlined,
} from '@ant-design/icons';
import {
    Alert,
    Badge,
    Button,
    Card,
    Checkbox,
    Col,
    Descriptions,
    Divider,
    Drawer,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Steps,
    Switch,
    Table,
    Tabs,
    Tag,
    Timeline,
    Tree,
    TreeSelect,
    Typography,
    Upload,
    message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd';
import type { TabsProps } from 'antd';
import type { TreeDataNode } from 'antd';
import { orgTreeData } from './data';
import { useExpertStore } from './expert-database';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

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
    isFromTemplate?: boolean;
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

interface ApprovalHistory {
    id: string;
    reviewer: string;
    reviewerOrg: string;
    action: 'submit' | 'expert-assign' | 'approve' | 'return';
    remark?: string;
    time: string;
    level: number;
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
    orgKey: string;
    applicant: string;
    contactPhone: string;
    projectLevel: ProjectLevel;
    category: string;
    domain: string;
    isIndependent: string;
    budgetPlan: string;
    budgetCode: string;
    buildLocation: string;
    projectType: string;
    coverageScope: string;
    hasCrossDomainData: string;
    isHeadquartersInterface: string;
    policyDirection: string;
    policyName: string;
    totalInvestment: number;
    yearBudget: number;
    totalProjectInvestment: number;
    selfFunding: number;
    externalFunding: number;
    otherFunding: number;
    softwareFunding: number;
    hardwareFunding: number;
    otherTechFunding: number;
    brief: string;
    goal: string;
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

// ============ 常量与选项 ============

const PROJECT_LEVEL_OPTIONS = [
    { value: 'normal', label: '普通项目' },
    { value: 'key', label: '重点项目' },
];

const DEFAULT_NODES: ExecutionNode[] = [
    { id: 'node-1', name: '项目启动', description: '', nodeType: 'apply', order: 1, materials: [] },
    { id: 'node-2', name: '项目启动审核', description: '', nodeType: 'review', order: 2, materials: [] },
    { id: 'node-3', name: '需求确认', description: '', nodeType: 'apply', order: 3, materials: [] },
    { id: 'node-4', name: '需求确认审核', description: '', nodeType: 'review', order: 4, materials: [] },
    { id: 'node-5', name: '方案设计', description: '', nodeType: 'apply', order: 5, materials: [] },
    { id: 'node-6', name: '方案设计审核', description: '', nodeType: 'review', order: 6, materials: [] },
    { id: 'node-7', name: '测试', description: '', nodeType: 'apply', order: 7, materials: [] },
];

const NODE_TEMPLATES: Record<string, ExecutionNode[]> = {
    standard: [
        { id: 't1', name: '项目启动', description: '', nodeType: 'apply', order: 1, materials: [] },
        { id: 't2', name: '项目启动审核', description: '', nodeType: 'review', order: 2, materials: [] },
        { id: 't3', name: '需求确认', description: '', nodeType: 'apply', order: 3, materials: [] },
        { id: 't4', name: '需求确认审核', description: '', nodeType: 'review', order: 4, materials: [] },
        { id: 't5', name: '方案设计', description: '', nodeType: 'apply', order: 5, materials: [] },
        { id: 't6', name: '方案设计审核', description: '', nodeType: 'review', order: 6, materials: [] },
        { id: 't7', name: '测试', description: '', nodeType: 'apply', order: 7, materials: [] },
        { id: 't8', name: '测试审核', description: '', nodeType: 'review', order: 8, materials: [] },
        { id: 't9', name: '上线部署', description: '', nodeType: 'apply', order: 9, materials: [] },
        { id: 't10', name: '上线审核', description: '', nodeType: 'review', order: 10, materials: [] },
        { id: 't11', name: '项目结项', description: '', nodeType: 'apply', order: 11, materials: [] },
    ],
    threeSystem: [
        { id: 's1', name: '启动评审', description: '', nodeType: 'apply', order: 1, materials: [] },
        { id: 's2', name: '文件审核', description: '', nodeType: 'review', order: 2, materials: [] },
        { id: 's3', name: '现场审核', description: '', nodeType: 'apply', order: 3, materials: [] },
        { id: 's4', name: '问题整改', description: '', nodeType: 'apply', order: 4, materials: [] },
        { id: 's5', name: '整改审核', description: '', nodeType: 'review', order: 5, materials: [] },
        { id: 's6', name: '关闭', description: '', nodeType: 'review', order: 6, materials: [] },
    ],
};

const EXPERT_POOL: { name: string; org: string; type: ExpertType }[] = [
    { name: '张明远', org: '中国建材总院', type: 'expert' },
    { name: '李建华', org: '中材国际', type: 'expert' },
    { name: '王建国', org: '凯盛科技', type: 'expert' },
    { name: '赵文博', org: '中国巨石', type: 'expert' },
    { name: '陈志强', org: '中材科技', type: 'expert' },
    { name: '刘伟', org: '中材国际', type: 'business-domain' },
    { name: '孙丽', org: '中国建材总院', type: 'business-domain' },
    { name: '周涛', org: '凯盛科技', type: 'business-domain' },
    { name: '吴芳', org: '中建材投资', type: 'business-domain' },
    { name: '郑强', org: '天山材料', type: 'business-domain' },
];

const MATERIAL_OPTIONS = [
    { value: 'filing-application', label: '立项申请书' },
    { value: 'feasibility-report', label: '可行性研究报告' },
    { value: 'budget-detail', label: '预算明细表' },
    { value: 'technical-plan', label: '技术方案' },
    { value: 'test-report', label: '测试报告' },
    { value: 'acceptance-report', label: '验收报告' },
    { value: 'eia-report', label: '环评报告' },
    { value: 'contract', label: '合同文件' },
];

const statusMeta: Record<FilingStatus, { label: string; color: string }> = {
    'pending-review': { label: '待审核', color: 'processing' },
    'expert-reviewing': { label: '专家评审中', color: 'warning' },
    'returned': { label: '已退回', color: 'error' },
    'approved-level1': { label: '业务域评审中', color: 'cyan' },
    'approved': { label: '已通过', color: 'success' },
};

function nowString() {
    const now = new Date();
    const pad = (v: number) => String(v).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function formatMoney(value: number) {
    return value.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function computeMonths(startDate: string, endDate: string): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return Math.max(1, Math.round(diffMonths));
}

function genId() {
    return `_${Math.random().toString(36).slice(2, 9)}`;
}

// ============ 模拟数据 ============

const currentYear = new Date().getFullYear();

const initialFilingRecords: FilingRecord[] = [
    {
        id: 'filing-001',
        code: `${currentYear}_2071139461050580993`,
        filingDate: `${currentYear}-06-28`,
        projectName: '中材南京数字化平台升级项目',
        orgName: '中国中材国际工程股份有限公司',
        orgKey: '06-01',
        applicant: '张工',
        contactPhone: '13800138001',
        projectLevel: 'key',
        category: `${currentYear}年新增项目`,
        domain: '数字化',
        isIndependent: '是',
        budgetPlan: '年度计划内',
        budgetCode: `632904-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        buildLocation: '国内',
        projectType: '系统建设类',
        coverageScope: '覆盖中材国际（南京）全部业务流程，包括生产管理、质量管理、设备管理、供应链管理及行政管理等模块，实现集团-二级-三级企业的数据贯通。',
        hasCrossDomainData: '否',
        isHeadquartersInterface: '否',
        policyDirection: '集团指导',
        policyName: '集团数字化转型指导意见',
        totalInvestment: 350,
        yearBudget: 200,
        totalProjectInvestment: 420,
        selfFunding: 200,
        externalFunding: 100,
        otherFunding: 50,
        softwareFunding: 120,
        hardwareFunding: 80,
        otherTechFunding: 150,
        brief: '围绕中材国际（南京）现有数字化平台，进行整体升级改造，涵盖ERP、MES和OA系统，提升业务协同效率与数据贯通能力。',
        goal: '建成统一数字化管理平台，实现业务流程全覆盖、数据全贯通，运营效率提升30%以上。',
        buildMode: '单位自建',
        buildType: '优化',
        startDate: `${currentYear}-03-01`,
        endDate: `${currentYear}-12-31`,
        submitTime: `${currentYear}-06-20 10:30`,
        submitter: '张工',
        status: 'pending-review',
        nodes: [...DEFAULT_NODES],
        experts: [],
        approvalHistory: [
            {
                id: 'ah-001',
                reviewer: '张工',
                reviewerOrg: '中材国际（南京）',
                action: 'submit',
                remark: '项目备案材料已提交，请审核。',
                time: `${currentYear}-06-20 10:30`,
                level: 1,
            },
        ],
        attachments: [
            { id: 'att-001', name: '项目立项备案表.pdf', size: '2.3 MB', uploadTime: `${currentYear}-06-20 10:25`, category: 'filing-doc' },
            { id: 'att-002', name: '项目可行性研究报告.pdf', size: '5.1 MB', uploadTime: `${currentYear}-06-20 10:28`, category: 'filing-doc' },
        ],
        hasExpertReviewDoc: false,
        reviewLevel: 1,
    },
    {
        id: 'filing-002',
        code: `BA-${currentYear}-002`,
        filingDate: `${currentYear}-06-22`,
        projectName: '中国建材装备集团智能制造项目',
        orgName: '中国建材装备集团',
        orgKey: '06-02',
        applicant: '李工',
        contactPhone: '13800138002',
        projectLevel: 'key',
        category: `${currentYear}年新增项目`,
        domain: '智能制造',
        isIndependent: '是',
        budgetPlan: '年度计划内',
        budgetCode: `632904-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        buildLocation: '国内',
        projectType: '系统建设类',
        coverageScope: '覆盖装备集团智能制造产线全流程，包括生产线自动化控制、质量检测、设备运维及数据分析等。',
        hasCrossDomainData: '否',
        isHeadquartersInterface: '是',
        policyDirection: '国家指导',
        policyName: '十四五智能制造发展规划',
        totalInvestment: 820,
        yearBudget: 500,
        totalProjectInvestment: 980,
        selfFunding: 500,
        externalFunding: 200,
        otherFunding: 120,
        softwareFunding: 300,
        hardwareFunding: 350,
        otherTechFunding: 170,
        brief: '建设智能制造示范线，实现生产全流程数字化管控与智能决策。',
        goal: '打造行业领先的智能制造标杆，产能提升20%，能耗降低15%。',
        buildMode: '集团/股份二级企业统建',
        buildType: '新建',
        startDate: `${currentYear}-04-01`,
        endDate: `${currentYear + 1}-06-30`,
        submitTime: `${currentYear}-06-22 09:15`,
        submitter: '李工',
        status: 'pending-review',
        nodes: [...DEFAULT_NODES],
        experts: [],
        approvalHistory: [
            {
                id: 'ah-002',
                reviewer: '李工',
                reviewerOrg: '中国建材装备集团',
                action: 'submit',
                remark: '智能制造项目备案材料齐全，请审核。',
                time: `${currentYear}-06-22 09:15`,
                level: 1,
            },
        ],
        attachments: [
            { id: 'att-003', name: '智能制造项目建设方案.pdf', size: '8.5 MB', uploadTime: `${currentYear}-06-22 09:10`, category: 'filing-doc' },
            { id: 'att-004', name: '投资预算明细表.xlsx', size: '1.2 MB', uploadTime: `${currentYear}-06-22 09:12`, category: 'filing-doc' },
        ],
        hasExpertReviewDoc: true,
        reviewLevel: 1,
    },
    {
        id: 'filing-003',
        code: `BA-${currentYear}-003`,
        filingDate: `${currentYear}-06-23`,
        projectName: '合肥装备科技数据看板项目',
        orgName: '中建材（合肥）装备科技有限公司',
        orgKey: '06-03',
        applicant: '王工',
        contactPhone: '13800138003',
        projectLevel: 'normal',
        category: `${currentYear - 1}年预算内未开工项目`,
        domain: '数字化',
        isIndependent: '否',
        budgetPlan: '年度计划内',
        budgetCode: `632904-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        buildLocation: '国内',
        projectType: '系统建设类',
        coverageScope: '覆盖合肥装备科技生产、质量、设备等核心业务数据展示。',
        hasCrossDomainData: '否',
        isHeadquartersInterface: '否',
        policyDirection: '集团指导',
        policyName: '集团数据治理三年行动计划',
        totalInvestment: 180,
        yearBudget: 120,
        totalProjectInvestment: 210,
        selfFunding: 120,
        externalFunding: 40,
        otherFunding: 20,
        softwareFunding: 80,
        hardwareFunding: 50,
        otherTechFunding: 50,
        brief: '建设企业级数据看板，实现生产、质量、设备等核心数据的实时监控与分析。',
        goal: '实现关键指标实时可视化，支持数据驱动的管理决策。',
        buildMode: '单位自建',
        buildType: '新建',
        startDate: `${currentYear}-05-01`,
        endDate: `${currentYear}-11-30`,
        submitTime: `${currentYear}-06-23 14:20`,
        submitter: '王工',
        status: 'pending-review',
        nodes: [...DEFAULT_NODES],
        experts: [],
        approvalHistory: [
            {
                id: 'ah-003',
                reviewer: '王工',
                reviewerOrg: '中建材（合肥）装备科技有限公司',
                action: 'submit',
                remark: '数据看板项目备案申请。',
                time: `${currentYear}-06-23 14:20`,
                level: 1,
            },
        ],
        attachments: [
            { id: 'att-005', name: '项目备案申请表.pdf', size: '1.5 MB', uploadTime: `${currentYear}-06-23 14:18`, category: 'filing-doc' },
        ],
        hasExpertReviewDoc: false,
        reviewLevel: 1,
    },
    {
        id: 'filing-004',
        code: `BA-${currentYear}-004`,
        filingDate: `${currentYear}-06-24`,
        projectName: '合肥水泥研究院预算联动系统',
        orgName: '合肥水泥研究设计院有限公司',
        orgKey: '06-04',
        applicant: '赵工',
        contactPhone: '13800138004',
        projectLevel: 'normal',
        category: `${currentYear}年新增项目`,
        domain: '财务',
        isIndependent: '是',
        budgetPlan: '年度计划内',
        budgetCode: `632904-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        buildLocation: '国内',
        projectType: '系统建设类',
        coverageScope: '覆盖合肥水泥研究设计院预算编制、执行、分析全流程。',
        hasCrossDomainData: '否',
        isHeadquartersInterface: '否',
        policyDirection: '集团指导',
        policyName: '集团预算管理优化方案',
        totalInvestment: 120,
        yearBudget: 80,
        totalProjectInvestment: 150,
        selfFunding: 80,
        externalFunding: 30,
        otherFunding: 10,
        softwareFunding: 60,
        hardwareFunding: 30,
        otherTechFunding: 30,
        brief: '建立预算编制与执行联动系统，实现预算全流程数字化管理。',
        goal: '预算编制效率提升50%，执行偏差率控制在5%以内。',
        buildMode: '单位自建',
        buildType: '新建',
        startDate: `${currentYear}-06-01`,
        endDate: `${currentYear}-12-31`,
        submitTime: `${currentYear}-06-24 08:45`,
        submitter: '赵工',
        status: 'pending-review',
        nodes: [...DEFAULT_NODES],
        experts: [],
        approvalHistory: [
            {
                id: 'ah-004',
                reviewer: '赵工',
                reviewerOrg: '合肥水泥研究设计院有限公司',
                action: 'submit',
                remark: '预算联动系统备案申请。',
                time: `${currentYear}-06-24 08:45`,
                level: 1,
            },
        ],
        attachments: [
            { id: 'att-006', name: '预算系统建设方案.pdf', size: '3.2 MB', uploadTime: `${currentYear}-06-24 08:40`, category: 'filing-doc' },
        ],
        hasExpertReviewDoc: false,
        reviewLevel: 1,
    },
    {
        id: 'filing-005',
        code: `BA-${currentYear}-005`,
        filingDate: `${currentYear}-06-21`,
        projectName: '成都建材院数字底座优化',
        orgName: '成都建筑材料工业设计研究院有限公司',
        orgKey: '06-05',
        applicant: '陈工',
        contactPhone: '13800138005',
        projectLevel: 'key',
        category: `${currentYear - 1}年预算内续建项目`,
        domain: '数字化',
        isIndependent: '是',
        budgetPlan: '年度计划内',
        budgetCode: `632904-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        buildLocation: '国内',
        projectType: '系统建设类',
        coverageScope: '覆盖成都建材院全部数字化系统底层架构，实现数据中台与业务中台双轮驱动。',
        hasCrossDomainData: '是',
        isHeadquartersInterface: '是',
        policyDirection: '国家指导',
        policyName: '数字经济发展战略纲要',
        totalInvestment: 450,
        yearBudget: 300,
        totalProjectInvestment: 530,
        selfFunding: 300,
        externalFunding: 100,
        otherFunding: 50,
        softwareFunding: 180,
        hardwareFunding: 150,
        otherTechFunding: 120,
        brief: '优化升级成都建材院数字底座，增强数据中台能力，支撑业务系统快速迭代。',
        goal: '建成行业领先的数字底座，支撑5个以上核心业务系统，数据响应速度提升40%。',
        buildMode: '集团统筹',
        buildType: '优化',
        startDate: `${currentYear}-03-15`,
        endDate: `${currentYear + 1}-03-14`,
        submitTime: `${currentYear}-06-21 16:00`,
        submitter: '陈工',
        status: 'expert-reviewing',
        nodes: [...DEFAULT_NODES],
        experts: [
            {
                id: 'exp-001',
                expertName: '张明远',
                expertType: 'expert',
                expertOrg: '中国建材总院',
                status: 'submitted',
                opinion: '数字底座优化方案合理，架构设计符合集团技术规范。建议增加数据安全模块，强化数据治理能力。',
                submitTime: `${currentYear}-06-25 10:30`,
            },
            {
                id: 'exp-002',
                expertName: '刘伟',
                expertType: 'business-domain',
                expertOrg: '中材国际',
                status: 'submitted',
                opinion: '从业务角度看，建议优先对接MES和ERP系统，确保核心业务数据的实时贯通。',
                submitTime: `${currentYear}-06-25 14:00`,
            },
            {
                id: 'exp-003',
                expertName: '孙丽',
                expertType: 'business-domain',
                expertOrg: '中国建材总院',
                status: 'pending',
            },
        ],
        approvalHistory: [
            {
                id: 'ah-005',
                reviewer: '陈工',
                reviewerOrg: '成都建筑材料工业设计研究院有限公司',
                action: 'submit',
                remark: '数字底座优化项目备案，请审核。',
                time: `${currentYear}-06-21 16:00`,
                level: 1,
            },
            {
                id: 'ah-006',
                reviewer: '王审核',
                reviewerOrg: '中材国际（上级审批）',
                action: 'expert-assign',
                remark: '本项目涉及基础设施建设，需转专家和业务域人员评审。',
                time: `${currentYear}-06-24 09:30`,
                level: 1,
            },
        ],
        attachments: [
            { id: 'att-007', name: '数字底座建设方案.pdf', size: '6.5 MB', uploadTime: `${currentYear}-06-21 15:55`, category: 'filing-doc' },
            { id: 'att-008', name: '技术架构设计文档.pdf', size: '4.8 MB', uploadTime: `${currentYear}-06-21 15:58`, category: 'filing-doc' },
        ],
        hasExpertReviewDoc: true,
        reviewLevel: 1,
    },
    {
        id: 'filing-006',
        code: `BA-${currentYear}-006`,
        filingDate: `${currentYear}-06-19`,
        projectName: '中材矿山智慧矿山管理系统',
        orgName: '中材矿山建设有限公司',
        orgKey: '06-06',
        applicant: '刘工',
        contactPhone: '13800138006',
        projectLevel: 'normal',
        category: `${currentYear}年新增项目`,
        domain: '生产',
        isIndependent: '是',
        budgetPlan: '年度计划内',
        budgetCode: `632904-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        buildLocation: '国内',
        projectType: '系统建设类',
        coverageScope: '覆盖智慧矿山生产管理、安全监控、环保监测全流程。',
        hasCrossDomainData: '否',
        isHeadquartersInterface: '否',
        policyDirection: '地方政府指导',
        policyName: '智慧矿山建设指导意见',
        totalInvestment: 280,
        yearBudget: 180,
        totalProjectInvestment: 320,
        selfFunding: 180,
        externalFunding: 70,
        otherFunding: 30,
        softwareFunding: 100,
        hardwareFunding: 120,
        otherTechFunding: 60,
        brief: '建设智慧矿山管理平台，实现矿山生产、安全、环保的数字化管理。',
        goal: '提高矿山管理效率30%，安全风险预警准确率95%以上。',
        buildMode: '单位自建',
        buildType: '新建',
        startDate: `${currentYear}-04-15`,
        endDate: `${currentYear}-12-31`,
        submitTime: `${currentYear}-06-19 11:00`,
        submitter: '刘工',
        status: 'pending-review',
        nodes: [...DEFAULT_NODES],
        experts: [],
        approvalHistory: [
            {
                id: 'ah-007',
                reviewer: '刘工',
                reviewerOrg: '中材矿山建设有限公司',
                action: 'submit',
                remark: '智慧矿山管理系统备案申请。',
                time: `${currentYear}-06-19 11:00`,
                level: 1,
            },
        ],
        attachments: [
            { id: 'att-009', name: '智慧矿山建设方案.pdf', size: '4.1 MB', uploadTime: `${currentYear}-06-19 10:55`, category: 'filing-doc' },
        ],
        hasExpertReviewDoc: false,
        reviewLevel: 1,
    },
    {
        id: 'filing-007',
        code: `BA-${currentYear}-007`,
        filingDate: `${currentYear}-06-18`,
        projectName: '中材国际工地协同执行平台',
        orgName: '中材国际股份有限公司',
        orgKey: '06',
        applicant: '周工',
        contactPhone: '13800138007',
        projectLevel: 'key',
        category: `${currentYear}年新增项目`,
        domain: '项目管理',
        isIndependent: '是',
        budgetPlan: '年度计划内',
        budgetCode: `632904-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        buildLocation: '国内',
        projectType: '系统建设类',
        coverageScope: '覆盖中材国际全部在建工地项目，实现现场管理与总部决策实时联动。',
        hasCrossDomainData: '是',
        isHeadquartersInterface: '是',
        policyDirection: '集团指导',
        policyName: '集团工程项目管理规范',
        totalInvestment: 560,
        yearBudget: 350,
        totalProjectInvestment: 680,
        selfFunding: 350,
        externalFunding: 150,
        otherFunding: 60,
        softwareFunding: 200,
        hardwareFunding: 180,
        otherTechFunding: 180,
        brief: '建设工地协同执行平台，实现工地现场管理与总部决策的实时联动。',
        goal: '工地管理透明度提升50%，决策响应时间缩短60%。',
        buildMode: '集团/股份二级企业统建',
        buildType: '新建',
        startDate: `${currentYear}-05-01`,
        endDate: `${currentYear + 1}-04-30`,
        submitTime: `${currentYear}-06-18 15:30`,
        submitter: '周工',
        status: 'approved-level1',
        nodes: [...DEFAULT_NODES],
        experts: [],
        approvalHistory: [
            {
                id: 'ah-008',
                reviewer: '周工',
                reviewerOrg: '中材国际股份有限公司',
                action: 'submit',
                remark: '工地协同执行平台备案申请。',
                time: `${currentYear}-06-18 15:30`,
                level: 1,
            },
            {
                id: 'ah-009',
                reviewer: '王审核',
                reviewerOrg: '中材国际（二级审批）',
                action: 'approve',
                remark: '项目方案合理，同意通过二级审批，转集团终审。',
                time: `${currentYear}-06-22 10:00`,
                level: 1,
            },
        ],
        attachments: [
            { id: 'att-010', name: '工地协同平台建设方案.pdf', size: '7.2 MB', uploadTime: `${currentYear}-06-18 15:25`, category: 'filing-doc' },
            { id: 'att-011', name: '投资预算明细.xlsx', size: '0.8 MB', uploadTime: `${currentYear}-06-18 15:28`, category: 'filing-doc' },
        ],
        hasExpertReviewDoc: false,
        reviewLevel: 2,
    },
];

// ============ Expert Selector Modal ============

function ExpertSelectorModal({
    open,
    onClose,
    onConfirm,
    existingExperts,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: (selected: { name: string; type: ExpertType; org: string }[]) => void;
    existingExperts: ExpertOpinion[];
}) {
    const [needExpertReview, setNeedExpertReview] = useState(false);
    const [selectedExpertIds, setSelectedExpertIds] = useState<string[]>([]);
    const [needBusinessReview, setNeedBusinessReview] = useState(false);
    const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>([]);

    const { getExpertOptions, experts } = useExpertStore();

    // 专家选项从专家库获取，兜底使用原有 EXPERT_POOL
    const expertOptions = getExpertOptions();
    const fallbackExpertOptions = EXPERT_POOL.filter((e) => e.type === 'expert').map((e) => ({
        value: e.name,
        label: `${e.name} · ${e.org}`,
    }));
    const displayExpertOptions = expertOptions.length > 0 ? expertOptions : fallbackExpertOptions;

    // 组织树仅叶子节点可勾选，并在叶子下挂模拟人员
    const businessTreeData = useMemo(() => {
        let personId = 0;
        const mockNames = ['张明', '李华', '王芳', '赵强', '陈静', '刘洋', '周磊', '吴敏', '郑伟', '孙悦'];
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
                // 叶子节点下挂 2~3 个人员
                const count = 2 + (personId % 2);
                const personnel: TreeDataNode[] = Array.from({ length: count }, () => {
                    const name = mockNames[personId % mockNames.length];
                    const p: TreeDataNode = {
                        title: name,
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
    }, []);

    useEffect(() => {
        if (open) {
            const expertNames = existingExperts.filter((e) => e.expertType === 'expert').map((e) => e.expertName);
            const businessNames = existingExperts.filter((e) => e.expertType === 'business-domain').map((e) => e.expertName);
            setNeedExpertReview(expertNames.length > 0);
            setSelectedExpertIds(expertNames);
            setNeedBusinessReview(businessNames.length > 0);
            setSelectedBusinessIds(businessNames);
        }
    }, [open, existingExperts]);

    // 从树中根据 key 查找标题
    const findTitleByKey = (nodes: TreeDataNode[], key: string): string | null => {
        for (const node of nodes) {
            if (node.key === key) return String(node.title);
            if (node.children) {
                const found = findTitleByKey(node.children as TreeDataNode[], key);
                if (found) return found;
            }
        }
        return null;
    };

    const handleConfirm = () => {
        const selected: { name: string; type: ExpertType; org: string }[] = [];
        if (needExpertReview) {
            // 优先从专家库获取专家信息，兜底使用 EXPERT_POOL
            selectedExpertIds.forEach((name) => {
                const storeExpert = experts.find((e) => e.name === name);
                if (storeExpert) {
                    selected.push({ name: storeExpert.name, type: 'expert', org: storeExpert.org });
                } else {
                    const fallback = EXPERT_POOL.find((e) => e.type === 'expert' && e.name === name);
                    if (fallback) {
                        selected.push({ name: fallback.name, type: 'expert', org: fallback.org });
                    }
                }
            });
        }
        if (needBusinessReview) {
            selectedBusinessIds.forEach((key) => {
                const title = findTitleByKey(businessTreeData, key);
                selected.push({ name: title || key, type: 'business-domain', org: '' });
            });
        }
        onConfirm(selected);
    };

    return (
        <Modal
            title="选择评审人员"
            open={open}
            onCancel={onClose}
            onOk={handleConfirm}
            width={640}
            okText="确认选择"
            cancelText="取消"
        >
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
                {/* 专家评审 */}
                <Card size="small" title={<span>专家评审 <Switch
                    checked={needExpertReview}
                    onChange={(v) => {
                        setNeedExpertReview(v);
                        if (!v) setSelectedExpertIds([]);
                    }}
                    style={{ marginLeft: 8 }}
                /></span>}>
                    {needExpertReview && (
                        <Select
                            mode="multiple"
                            value={selectedExpertIds}
                            onChange={(v) => setSelectedExpertIds(v)}
                            options={displayExpertOptions}
                            placeholder="请选择专家"
                            style={{ width: '100%' }}
                            maxTagCount={3}
                        />
                    )}
                </Card>

                {/* 业务域评审 */}
                <Card size="small" title={<span>业务域评审 <Switch
                    checked={needBusinessReview}
                    onChange={(v) => {
                        setNeedBusinessReview(v);
                        if (!v) setSelectedBusinessIds([]);
                    }}
                    style={{ marginLeft: 8 }}
                /></span>}>
                    {needBusinessReview && (
                        <TreeSelect
                            treeData={businessTreeData}
                            value={selectedBusinessIds}
                            onChange={(v) => setSelectedBusinessIds(v as string[])}
                            placeholder="请选择业务域人员"
                            treeCheckable
                            showCheckedStrategy={TreeSelect.SHOW_CHILD}
                            maxTagCount={3}
                            style={{ width: '100%' }}
                            fieldNames={{ value: 'key', label: 'title', children: 'children' }}
                            showSearch
                            treeNodeFilterProp="title"
                            treeDefaultExpandAll
                        />
                    )}
                </Card>
            </Space>
        </Modal>
    );
}

// ============ 备案详情/审核抽屉 ============

function FilingDetailDrawer({
    record,
    open,
    onClose,
    onSaveNodes,
    onAssignExperts,
    onApprove,
    onReturn,
}: {
    record: FilingRecord | null;
    open: boolean;
    onClose: () => void;
    onSaveNodes: (id: string, nodes: ExecutionNode[]) => void;
    onAssignExperts: (id: string, experts: { name: string; type: ExpertType; org: string }[]) => void;
    onApprove: (id: string, remark?: string) => void;
    onReturn: (id: string, remark: string) => void;
}) {
    const [activeTab, setActiveTab] = useState('basic');
    const [nodes, setNodes] = useState<ExecutionNode[]>([]);
    const [projectLevel, setProjectLevel] = useState<ProjectLevel>('normal');
    const [expertModalOpen, setExpertModalOpen] = useState(false);
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [returnRemark, setReturnRemark] = useState('');
    const [expertOpinion, setExpertOpinion] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<FilingAttachment[]>([]);

    useEffect(() => {
        if (open && record) {
            setNodes([...record.nodes]);
            setProjectLevel(record.projectLevel);
            setUploadedFiles([...record.attachments]);
            setExpertOpinion('');
            setActiveTab('basic');
        }
    }, [open, record]);

    if (!record) return null;

    const isReviewing = record.status === 'pending-review' || record.status === 'expert-reviewing';
    const allExpertsSubmitted = record.experts.length > 0 && record.experts.every((e) => e.status === 'submitted');

    const handleAddNode = () => {
        const newNode: ExecutionNode = {
            id: genId(),
            name: '',
            description: '',
            nodeType: 'apply',
            order: nodes.length + 1,
            materials: [],
        };
        setNodes([...nodes, newNode]);
    };

    const handleRemoveNode = (nodeId: string) => {
        setNodes(nodes.filter((n) => n.id !== nodeId).map((n, i) => ({ ...n, order: i + 1 })));
    };

    const handleNodeNameChange = (nodeId: string, name: string) => {
        setNodes(nodes.map((n) => (n.id === nodeId ? { ...n, name } : n)));
    };

    const handleMoveNode = (index: number, direction: -1 | 1) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= nodes.length) return;
        const arr = [...nodes];
        [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
        setNodes(arr.map((n, i) => ({ ...n, order: i + 1 })));
    };

    const handleSaveNodes = () => {
        if (nodes.some((n) => !n.name.trim())) {
            message.warning('请填写所有节点名称。');
            return;
        }
        onSaveNodes(record.id, nodes);
        message.success('节点配置已保存。');
    };

    const handleExpertOpinionSubmit = () => {
        if (!expertOpinion.trim()) {
            message.warning('请填写评审意见。');
            return;
        }
        message.success('评审意见已提交。');
        setExpertOpinion('');
    };

    const handleReturnConfirm = () => {
        if (!returnRemark.trim()) {
            message.warning('请填写退回原因。');
            return;
        }
        onReturn(record.id, returnRemark);
        setReturnModalOpen(false);
        setReturnRemark('');
    };

    const uploadProps: UploadProps = {
        name: 'file',
        multiple: true,
        showUploadList: true,
        beforeUpload: (file) => {
            const exists = uploadedFiles.some((f) => f.name === file.name);
            if (exists) {
                message.warning(`文件 "${file.name}" 已存在。`);
                return Upload.LIST_IGNORE;
            }
            const newFile: FilingAttachment = {
                id: genId(),
                name: file.name,
                size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
                uploadTime: nowString(),
                category: 'expert-review-doc',
            };
            setUploadedFiles((prev) => [...prev, newFile]);
            message.success(`${file.name} 上传成功。`);
            return false;
        },
        onRemove: (file) => {
            setUploadedFiles((prev) => prev.filter((f) => f.name !== file.name));
        },
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 13, color: 'rgba(0,0,0,0.55)', flexShrink: 0,
        minWidth: 120, textAlign: 'right', marginRight: 8,
    };
    const valueStyle: React.CSSProperties = { fontSize: 13, color: 'rgba(0,0,0,0.85)', wordBreak: 'break-all' };
    const itemStyle: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', minWidth: 0 };
    const itemStyleFull: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gridColumn: '1 / -1', minWidth: 0 };

    const basicInfoItems: TabsProps['items'] = [
        {
            key: 'basic',
            label: '基本信息',
            children: (
                <div>
                    {/* 顶部：申请单位 / 备案号 / 日期 */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 32, padding: '12px 16px',
                        background: '#fafafa', borderRadius: 8, marginBottom: 16,
                        border: '1px solid #f0f0f0',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text type="secondary" style={{ fontSize: 13 }}>申请单位：</Text>
                            <Text style={{ fontSize: 13 }}>{record.orgName}</Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text type="secondary" style={{ fontSize: 13 }}>备案号：</Text>
                            <Text style={{ fontSize: 13, fontFamily: 'monospace' }}>{record.code}</Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text type="secondary" style={{ fontSize: 13 }}>日期：</Text>
                            <Text style={{ fontSize: 13 }}>{record.filingDate}</Text>
                        </div>
                    </div>

                    {/* 项目基本情况 */}
                    <Card
                        size="small"
                        title={<span style={{ fontWeight: 600, fontSize: 14 }}>项目基本情况</span>}
                        style={{ marginBottom: 16 }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 32px' }}>
                            <div style={itemStyle}><span style={labelStyle}>项目立项人</span><span style={valueStyle}>{record.applicant}</span></div>
                            <div style={itemStyle}><span style={labelStyle}>联系方式</span><span style={valueStyle}>{record.contactPhone}</span></div>
                            <div style={itemStyleFull}><span style={labelStyle}>项目名称</span><span style={valueStyle}>{record.projectName}</span></div>
                            <div style={itemStyle}><span style={labelStyle}>独立/非独立</span><span style={valueStyle}>{record.isIndependent}</span></div>
                            <div style={itemStyle}><span style={labelStyle}>项目预算计划</span><span style={valueStyle}>{record.budgetPlan}</span></div>
                            <div style={itemStyleFull}><span style={labelStyle}>预算编号</span><span style={valueStyle}><code>{record.budgetCode}</code></span></div>
                            <div style={itemStyle}><span style={labelStyle}>项目建设地点</span><span style={valueStyle}>{record.buildLocation}</span></div>
                            <div style={itemStyle}>
                                <span style={labelStyle}>项目级别</span>
                                <Select value={record.projectLevel} style={{ width: 130 }} size="small" options={PROJECT_LEVEL_OPTIONS} />
                            </div>
                            <div style={itemStyle}><span style={labelStyle}>项目类型</span><span style={valueStyle}>{record.projectType}</span></div>
                            <div style={itemStyle}><span style={labelStyle}>建设模式</span><span style={valueStyle}>{record.buildMode}</span></div>
                            <div style={itemStyle}><span style={labelStyle}>建设类型</span><span style={valueStyle}>{record.buildType}</span></div>
                            <div style={itemStyleFull}>
                                <span style={labelStyle}>项目覆盖范围</span>
                                <span style={valueStyle}>{record.coverageScope}</span>
                            </div>
                            <div style={itemStyleFull}>
                                <span style={labelStyle}>主要建设内容</span>
                                <span style={valueStyle}>{record.brief}</span>
                            </div>
                            <div style={itemStyle}><span style={labelStyle}>计划开始建设时间</span><span style={valueStyle}>{record.startDate}</span></div>
                            <div style={itemStyle}><span style={labelStyle}>计划结束建设时间</span><span style={valueStyle}>{record.endDate}</span></div>
                            <div style={itemStyle}><span style={labelStyle}>计划建设工期</span><span style={valueStyle}>{computeMonths(record.startDate, record.endDate)} 个月</span></div>
                            <div style={itemStyle}><span style={labelStyle}>是否有跨域数据权限</span><span style={valueStyle}>{record.hasCrossDomainData}</span></div>
                            <div style={itemStyle}><span style={labelStyle}>是否总部接口</span><span style={valueStyle}>{record.isHeadquartersInterface}</span></div>
                        </div>
                    </Card>

                    {/* 项目投入情况 */}
                    <Card
                        size="small"
                        title={<span style={{ fontWeight: 600, fontSize: 14 }}>项目投入情况</span>}
                        style={{ marginBottom: 16 }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 24px' }}>
                            <div style={itemStyle}><span style={labelStyle}>当年预算金额(万元)</span><span style={{ ...valueStyle, fontWeight: 500 }}>¥{formatMoney(record.yearBudget)}</span></div>
                            <div style={itemStyle}><span style={labelStyle}>预算总额(万元)</span><span style={{ ...valueStyle, fontWeight: 500 }}>¥{formatMoney(record.totalInvestment)}</span></div>
                            <div style={itemStyle}><span style={labelStyle}>项目总投资(万元)</span><span style={{ ...valueStyle, fontWeight: 500 }}>¥{formatMoney(record.totalProjectInvestment)}</span></div>
                            <div style={itemStyle}><span style={labelStyle}>自有资金(万元)</span><span style={{ ...valueStyle, fontWeight: 500 }}>¥{formatMoney(record.selfFunding)}</span></div>
                            <div style={itemStyle}><span style={labelStyle}>外部资金(万元)</span><span style={{ ...valueStyle, fontWeight: 500 }}>¥{formatMoney(record.externalFunding)}</span></div>
                        </div>
                    </Card>

                    {/* 附件列表 */}
                    <Card
                        size="small"
                        title={<span style={{ fontWeight: 600, fontSize: 14 }}>附件</span>}
                        style={{ marginBottom: 16 }}
                    >
                        <Descriptions column={1} size="small" colon={false}>
                            <Descriptions.Item label="立项单位意见">
                                <Tag icon={<PaperClipOutlined />} color="blue" style={{ cursor: 'pointer' }}>
                                    项目立项意见.pdf
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="立项建议书">
                                <Tag icon={<PaperClipOutlined />} color="blue" style={{ cursor: 'pointer' }}>
                                    项目立项建议书.pdf
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="其他附件">
                                <span style={{ color: '#999', fontSize: 12 }}>暂无</span>
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </div>
            ),
        },
        {
            key: 'nodes',
            label: '节点配置',
            children: (
                <div>
                    <Card
                        size="small"
                        title={<span style={{ fontWeight: 600, fontSize: 14 }}>项目执行节点</span>}
                        extra={
                            isReviewing && (
                                <Space>
                                    <Select
                                        placeholder="选择预设模板"
                                        style={{ width: 160 }}
                                        size="small"
                                        options={[
                                            { value: 'standard', label: '标准流程节点' },
                                            { value: 'threeSystem', label: '三体系流程节点' },
                                        ]}
                                        onChange={(value) => {
                                            if (value && NODE_TEMPLATES[value as string]) {
                                                const template = NODE_TEMPLATES[value as string].map((t, i) => ({
                                                    ...t,
                                                    id: genId(),
                                                    order: i + 1,
                                                    isFromTemplate: true,
                                                }));
                                                setNodes(template);
                                                message.success('已加载预设节点模板');
                                            }
                                        }}
                                        value={undefined as any}
                                    />
                                    <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={handleAddNode}>
                                        添加节点
                                    </Button>
                                    <Button type="primary" size="small" onClick={handleSaveNodes}>
                                        保存节点配置
                                    </Button>
                                </Space>
                            )
                        }
                        style={{ marginBottom: 16 }}
                    >
                        <Table
                            rowKey="id"
                            dataSource={nodes}
                            pagination={false}
                            size="small"
                            scroll={{ y: nodes.length > 8 ? 400 : undefined }}
                        >
                            <Table.Column
                                title="序号"
                                width={60}
                                render={(_, __, index) => index + 1}
                            />
                            <Table.Column
                                title="节点名称"
                                width={200}
                                render={(_, node: ExecutionNode) =>
                                    isReviewing ? (
                                        <Input
                                            size="small"
                                            value={node.name}
                                            onChange={(e) => handleNodeNameChange(node.id, e.target.value)}
                                            placeholder="节点名称"
                                        />
                                    ) : (
                                        <Text>{node.name}</Text>
                                    )
                                }
                            />
                            <Table.Column
                                title="描述"
                                render={(_, node: ExecutionNode) =>
                                    isReviewing ? (
                                        <Input
                                            size="small"
                                            value={node.description}
                                            onChange={(e) => setNodes(nodes.map((n) => n.id === node.id ? { ...n, description: e.target.value } : n))}
                                            placeholder="请输入描述"
                                        />
                                    ) : (
                                        <Text>{node.description || '-'}</Text>
                                    )
                                }
                            />
                            <Table.Column
                                title="所需材料"
                                width={200}
                                render={(_, node: ExecutionNode) =>
                                    isReviewing ? (
                                        <Select
                                            mode="multiple"
                                            size="small"
                                            value={node.materials || []}
                                            onChange={(v) => setNodes(nodes.map((n) => n.id === node.id ? { ...n, materials: v } : n))}
                                            options={MATERIAL_OPTIONS}
                                            placeholder="选择所需材料"
                                            maxTagCount={2}
                                            style={{ width: '100%' }}
                                        />
                                    ) : (
                                        <Text>{(node.materials || []).map((m) => MATERIAL_OPTIONS.find((o) => o.value === m)?.label || m).join('、') || '-'}</Text>
                                    )
                                }
                            />
                            <Table.Column
                                title="节点类型"
                                width={110}
                                render={(_, node: ExecutionNode) =>
                                    isReviewing ? (
                                        <Select
                                            size="small"
                                            value={node.nodeType}
                                            onChange={(v) => setNodes(nodes.map((n) => n.id === node.id ? { ...n, nodeType: v } : n))}
                                            options={[
                                                { value: 'apply', label: '申请' },
                                                { value: 'review', label: '审核' },
                                            ]}
                                            style={{ width: 90 }}
                                            disabled={node.isFromTemplate}
                                        />
                                    ) : (
                                        <Tag color={node.nodeType === 'apply' ? 'blue' : 'orange'}>
                                            {node.nodeType === 'apply' ? '申请' : '审核'}
                                        </Tag>
                                    )
                                }
                            />
                            {isReviewing && (
                                <Table.Column
                                    title="操作"
                                    width={70}
                                    render={(_, node: ExecutionNode) => (
                                        <Button
                                            type="text"
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleRemoveNode(node.id)}
                                        />
                                    )}
                                />
                            )}
                        </Table>
                    </Card>
                </div>
            ),
        },
        {
            key: 'approval',
            label: (
                <span>
                    审批信息
                    {record.experts.some((e) => e.status === 'submitted') && (
                        <Badge dot style={{ marginLeft: 4 }} />
                    )}
                </span>
            ),
            children: (
                <div>
                    {/* 技术专家评审意见 */}
                    {record.experts.filter((e) => e.expertType === 'expert').length > 0 && (
                        <Card size="small" title="技术专家评审意见" style={{ marginBottom: 16 }}>
                            <Space direction="vertical" style={{ width: '100%' }} size={12}>
                                {record.experts.filter((e) => e.expertType === 'expert').map((expert) => (
                                    <div
                                        key={expert.id}
                                        style={{
                                            padding: 12,
                                            background: expert.status === 'submitted' ? '#f6ffed' : '#fffbe6',
                                            borderRadius: 8,
                                            border: `1px solid ${expert.status === 'submitted' ? '#b7eb8f' : '#ffe58f'}`,
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <Space>
                                                <UserOutlined />
                                                <Text strong>{expert.expertName}</Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>{expert.expertOrg}</Text>
                                            </Space>
                                            <Tag color={expert.status === 'submitted' ? 'success' : 'processing'}>
                                                {expert.status === 'submitted' ? '已提交' : '待提交'}
                                            </Tag>
                                        </div>
                                        {expert.status === 'submitted' && expert.opinion ? (
                                            <div
                                                style={{
                                                    padding: '8px 12px',
                                                    background: '#fff',
                                                    borderRadius: 6,
                                                    border: '1px solid #f0f0f0',
                                                    fontSize: 13,
                                                    lineHeight: 1.6,
                                                    color: 'rgba(0,0,0,0.65)',
                                                }}
                                            >
                                                <Text type="secondary" style={{ fontSize: 11 }}>评审意见：</Text>
                                                <div style={{ marginTop: 4 }}>{expert.opinion}</div>
                                                <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>
                                                    提交时间：{expert.submitTime}
                                                </div>
                                            </div>
                                        ) : (
                                            <Text type="secondary" style={{ fontSize: 12 }}>等待提交评审意见...</Text>
                                        )}
                                    </div>
                                ))}
                            </Space>
                        </Card>
                    )}

                    {/* 业务域评审意见 */}
                    {record.experts.filter((e) => e.expertType === 'business-domain').length > 0 && (
                        <Card size="small" title="业务域评审意见" style={{ marginBottom: 16 }}>
                            <Space direction="vertical" style={{ width: '100%' }} size={12}>
                                {record.experts.filter((e) => e.expertType === 'business-domain').map((expert) => (
                                    <div
                                        key={expert.id}
                                        style={{
                                            padding: 12,
                                            background: expert.status === 'submitted' ? '#f6ffed' : '#fffbe6',
                                            borderRadius: 8,
                                            border: `1px solid ${expert.status === 'submitted' ? '#b7eb8f' : '#ffe58f'}`,
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <Space>
                                                <UserOutlined />
                                                <Text strong>{expert.expertName}</Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>{expert.expertOrg}</Text>
                                            </Space>
                                            <Tag color={expert.status === 'submitted' ? 'success' : 'processing'}>
                                                {expert.status === 'submitted' ? '已提交' : '待提交'}
                                            </Tag>
                                        </div>
                                        {expert.status === 'submitted' && expert.opinion ? (
                                            <div
                                                style={{
                                                    padding: '8px 12px',
                                                    background: '#fff',
                                                    borderRadius: 6,
                                                    border: '1px solid #f0f0f0',
                                                    fontSize: 13,
                                                    lineHeight: 1.6,
                                                    color: 'rgba(0,0,0,0.65)',
                                                }}
                                            >
                                                <Text type="secondary" style={{ fontSize: 11 }}>评审意见：</Text>
                                                <div style={{ marginTop: 4 }}>{expert.opinion}</div>
                                                <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>
                                                    提交时间：{expert.submitTime}
                                                </div>
                                            </div>
                                        ) : (
                                            <Text type="secondary" style={{ fontSize: 12 }}>等待提交评审意见...</Text>
                                        )}
                                    </div>
                                ))}
                            </Space>
                        </Card>
                    )}

                    {/* 审批记录 */}
                    <Card size="small" title="审批记录">
                        <Timeline
                            items={[
                                ...record.approvalHistory.map((h) => ({
                                    color: h.action === 'return' ? 'red' : h.action === 'approve' ? 'green' : 'blue',
                                    children: (
                                        <div>
                                            <div style={{ fontWeight: 500 }}>
                                                {h.reviewer}
                                                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                                    {h.reviewerOrg}
                                                </Text>
                                                <Tag
                                                    color={
                                                        h.action === 'approve' ? 'success'
                                                            : h.action === 'return' ? 'error'
                                                                : h.action === 'expert-assign' ? 'warning'
                                                                    : 'default'
                                                    }
                                                    style={{ marginLeft: 8, fontSize: 11 }}
                                                >
                                                    {h.action === 'submit' ? '提交'
                                                        : h.action === 'approve' ? '通过'
                                                            : h.action === 'return' ? '退回'
                                                                : '转专家'}
                                                </Tag>
                                            </div>
                                            {h.remark && (
                                                <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', marginTop: 4 }}>
                                                    {h.remark}
                                                </div>
                                            )}
                                            <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>
                                                {h.time}
                                            </div>
                                        </div>
                                    ),
                                })),
                                // 专家/业务域评审记录（已提交的评审意见作为Timeline节点）
                                ...record.experts.filter((e) => e.status === 'submitted').map((exp) => ({
                                    color: exp.expertType === 'expert' ? 'blue' as const : 'orange' as const,
                                    children: (
                                        <div>
                                            <div style={{ fontWeight: 500 }}>
                                                {exp.expertName}
                                                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                                    {exp.expertOrg}
                                                </Text>
                                                <Tag color={exp.expertType === 'expert' ? 'blue' : 'orange'} style={{ marginLeft: 8, fontSize: 11 }}>
                                                    {exp.expertType === 'expert' ? '专家评审' : '业务域评审'}
                                                </Tag>
                                            </div>
                                            {exp.opinion && (
                                                <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)', marginTop: 4 }}>
                                                    {exp.opinion}
                                                </div>
                                            )}
                                            <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>
                                                {exp.submitTime}
                                            </div>
                                        </div>
                                    ),
                                })),
                            ]}
                        />
                    </Card>
                </div>
            ),
        },
    ];

    return (
        <>
            <Drawer
                title={
                    <Space>
                        <span>备案审核</span>
                        <Tag color={statusMeta[record.status].color}>{statusMeta[record.status].label}</Tag>
                        <Tag color={record.projectLevel === 'key' ? 'red' : 'default'}>
                            {record.projectLevel === 'key' ? '重点项目' : '普通项目'}
                        </Tag>
                    </Space>
                }
                open={open}
                width="75%"
                onClose={onClose}
                destroyOnClose
                footer={
                    record.status === 'expert-reviewing' || record.status === 'approved-level1' ? (
                        <div>
                            <TextArea
                                value={expertOpinion}
                                onChange={(e) => setExpertOpinion(e.target.value)}
                                placeholder="请输入评审意见..."
                                rows={3}
                                maxLength={500}
                                showCount
                                style={{ marginBottom: 12 }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Space size={16}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {record.status === 'expert-reviewing' ? '技术专家评审中，请提交评审意见' : '业务域评审中，请提交评审意见'}
                                    </Text>
                                    {record.hasExpertReviewDoc && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            该单位已做过专家评审
                                        </Text>
                                    )}
                                </Space>
                                <Space>
                                    <Button onClick={onClose}>关闭</Button>
                                    <Button type="primary" icon={<SendOutlined />} onClick={handleExpertOpinionSubmit}>
                                        提交评审意见
                                    </Button>
                                </Space>
                            </div>
                        </div>
                    ) : isReviewing ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space>
                                <Button
                                    icon={<TeamOutlined />}
                                    onClick={() => setExpertModalOpen(true)}
                                >
                                    {record.experts.length > 0 ? '调整评审人员' : '转专家/业务域审批'}
                                </Button>
                                {record.hasExpertReviewDoc && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        该单位已做过专家评审
                                    </Text>
                                )}
                            </Space>
                            {activeTab === 'basic' ? (
                                <Space>
                                    <Button onClick={onClose}>关闭</Button>
                                    <Button type="primary" onClick={() => setActiveTab('nodes')}>
                                        下一步
                                    </Button>
                                </Space>
                            ) : (
                                <Space>
                                    <Button onClick={onClose}>关闭</Button>
                                    <Button
                                        danger
                                        icon={<RollbackOutlined />}
                                        onClick={() => setReturnModalOpen(true)}
                                    >
                                        退回
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<CheckCircleOutlined />}
                                        onClick={() => onApprove(record.id)}
                                    >
                                        通过
                                    </Button>
                                </Space>
                            )}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'right' }}>
                            <Button onClick={onClose}>关闭</Button>
                        </div>
                    )
                }
            >
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={basicInfoItems}
                    tabBarStyle={{ marginTop: -8 }}
                />
            </Drawer>

            {/* 专家选择弹窗 */}
            <ExpertSelectorModal
                open={expertModalOpen}
                onClose={() => setExpertModalOpen(false)}
                onConfirm={(selected) => {
                    onAssignExperts(record.id, selected);
                    setExpertModalOpen(false);
                }}
                existingExperts={record.experts}
            />

            {/* 退回确认弹窗 */}
            <Modal
                title="退回备案申请"
                open={returnModalOpen}
                onCancel={() => {
                    setReturnModalOpen(false);
                    setReturnRemark('');
                }}
                onOk={handleReturnConfirm}
                okText="确认退回"
                okButtonProps={{ danger: true }}
            >
                <Alert
                    type="warning"
                    showIcon
                    message="退回后，申报单位可修改后重新提交。"
                    style={{ marginBottom: 16 }}
                />
                <div style={{ marginBottom: 8 }}>
                    <Text strong>退回原因：</Text>
                </div>
                <TextArea
                    value={returnRemark}
                    onChange={(e) => setReturnRemark(e.target.value)}
                    placeholder="请填写退回原因和建议..."
                    rows={4}
                    maxLength={500}
                    showCount
                />
            </Modal>
        </>
    );
}

// ============ 备案管理列表页 ============

function FilingManagementList({
    records,
    onReview,
    onSaveNodes,
    onAssignExperts,
    onApprove,
    onReturn,
}: {
    records: FilingRecord[];
    onReview: (record: FilingRecord) => void;
    onSaveNodes: (id: string, nodes: ExecutionNode[]) => void;
    onAssignExperts: (id: string, experts: { name: string; type: ExpertType; org: string }[]) => void;
    onApprove: (id: string, remark?: string) => void;
    onReturn: (id: string, remark: string) => void;
}) {
    const [filters, setFilters] = useState<{
        keyword?: string;
        projectLevel?: string;
        status?: string;
    }>({});
    const [selectedOrgKey, setSelectedOrgKey] = useState('06');
    const [treeSearch, setTreeSearch] = useState('');
    const [includeChildren, setIncludeChildren] = useState(true);
    const [userExpandedKeys, setUserExpandedKeys] = useState<string[]>(['group']);

    function normalizeSelectedKeys(value: string | string[] | undefined) {
        if (typeof value === 'string') return [value];
        return Array.isArray(value) ? value : [];
    }

    function filterTreeData(nodes: TreeDataNode[], keyword: string): TreeDataNode[] {
        const kw = keyword.trim().toLowerCase();
        if (!kw) return nodes;
        return nodes.reduce<TreeDataNode[]>((acc, node) => {
            const title = String(node.title).toLowerCase();
            const filteredChildren = node.children ? filterTreeData(node.children as TreeDataNode[], keyword) : [];
            if (title.includes(kw) || filteredChildren.length > 0) {
                acc.push({ ...node, children: filteredChildren.length > 0 ? filteredChildren : node.children });
            }
            return acc;
        }, []);
    }

    const treeData = useMemo(
        () => filterTreeData(orgTreeData as TreeDataNode[], treeSearch),
        [treeSearch],
    );

    const expandedKeys = useMemo(() => {
        const kw = treeSearch.trim().toLowerCase();
        if (!kw) return userExpandedKeys;
        const searchKeys: string[] = [];
        const walk = (nodes: TreeDataNode[], parentKeys: string[]) => {
            nodes.forEach((node) => {
                const title = String(node.title).toLowerCase();
                const childKeys = [...parentKeys, node.key as string];
                if (title.includes(kw)) searchKeys.push(...childKeys);
                if (node.children) walk(node.children as TreeDataNode[], childKeys);
            });
        };
        walk(orgTreeData as TreeDataNode[], []);
        return [...new Set([...userExpandedKeys, ...searchKeys])];
    }, [treeSearch, userExpandedKeys]);

    const filteredRecords = useMemo(() => {
        return records.filter((r) => {
            const keyword = String(filters.keyword || '').trim().toLowerCase();
            const projectLevel = String(filters.projectLevel || '').trim();
            const status = String(filters.status || '').trim();

            if (selectedOrgKey !== 'group') {
                if (includeChildren) {
                    if (r.orgKey !== selectedOrgKey && !r.orgKey.startsWith(selectedOrgKey + '-')) return false;
                } else {
                    if (r.orgKey !== selectedOrgKey) return false;
                }
            }
            if (keyword) {
                const combined = [r.code, r.projectName, r.orgName].join(' ').toLowerCase();
                if (!combined.includes(keyword)) return false;
            }
            if (projectLevel && r.projectLevel !== projectLevel) return false;
            if (status && r.status !== status) return false;
            return true;
        });
    }, [records, filters, selectedOrgKey, includeChildren]);

    const columns: ColumnsType<FilingRecord> = [
        {
            title: '项目名称',
            dataIndex: 'projectName',
            width: 200,
            ellipsis: true,
            fixed: 'left',
        },
        {
            title: '单位名称',
            dataIndex: 'orgName',
            width: 160,
            ellipsis: true,
            fixed: 'left',
        },
        {
            title: '项目级别',
            width: 100,
            render: (_, r) => (
                <Tag color={r.projectLevel === 'key' ? 'red' : 'default'}>
                    {r.projectLevel === 'key' ? '重点项目' : '普通项目'}
                </Tag>
            ),
        },
        {
            title: '计划开始时间',
            dataIndex: 'startDate',
            width: 130,
        },
        {
            title: '计划结束时间',
            dataIndex: 'endDate',
            width: 130,
        },
        {
            title: <span style={{ whiteSpace: 'nowrap' }}>计划建设工期(月)</span>,
            width: 120,
            render: (_, r) => computeMonths(r.startDate, r.endDate),
        },
        {
            title: '预算总额(万元)',
            width: 130,
            render: (_, r) => (
                <span style={{ fontWeight: 500 }}>¥ {formatMoney(r.totalInvestment)}</span>
            ),
        },
        {
            title: '项目总投资(万元)',
            width: 140,
            render: (_, r) => (
                <span style={{ fontWeight: 500 }}>¥ {formatMoney(r.totalProjectInvestment)}</span>
            ),
        },
        {
            title: '状态',
            width: 110,
            render: (_, r) => (
                <Tag color={statusMeta[r.status].color}>{statusMeta[r.status].label}</Tag>
            ),
        },
        {
            title: '操作',
            width: 160,
            fixed: 'right',
            render: (_, r) => (
                <Space size={4}>
                    <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => onReview(r)}
                    >
                        审核
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="dmp-page-stack">
            <Row gutter={16}>
                <Col xs={24} lg={6}>
                    <Card className="dmp-card-fill">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontWeight: 600, fontSize: 14, lineHeight: '22px' }}>组织树</span>
                            <Checkbox
                                checked={includeChildren}
                                onChange={(e) => setIncludeChildren(e.target.checked)}
                            >
                                包含下级
                            </Checkbox>
                        </div>
                        <Input
                            allowClear
                            placeholder="输入关键字进行过滤"
                            value={treeSearch}
                            onChange={(e) => {
                                setTreeSearch(e.target.value);
                                if (!e.target.value) setUserExpandedKeys(['group']);
                            }}
                            style={{ marginBottom: 12 }}
                        />
                        <Tree
                            treeData={treeData}
                            expandedKeys={expandedKeys}
                            selectedKeys={normalizeSelectedKeys(selectedOrgKey)}
                            onSelect={(keys) => setSelectedOrgKey((keys[0] as string) || '06')}
                            onExpand={(keys) => setUserExpandedKeys(keys as string[])}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={18}>
                    {/* 查询条件 */}
                    <Card className="dmp-query-card" bordered={false}>
                        <Form
                            layout="inline"
                            className="dmp-query-form"
                            initialValues={{}}
                            onValuesChange={(_, allValues) => setFilters(allValues)}
                        >
                            <Form.Item name="keyword" label="项目编号/项目名称">
                                <Input allowClear placeholder="请输入项目编号或项目名称" style={{ width: 260 }} />
                            </Form.Item>
                            <Form.Item name="projectLevel" label="项目级别">
                                <Select
                                    allowClear
                                    placeholder="请选择项目级别"
                                    style={{ width: 140 }}
                                    options={PROJECT_LEVEL_OPTIONS}
                                />
                            </Form.Item>
                            <Form.Item name="status" label="审核状态">
                                <Select
                                    allowClear
                                    placeholder="请选择状态"
                                    style={{ width: 140 }}
                                    options={Object.entries(statusMeta).map(([value, meta]) => ({
                                        value,
                                        label: meta.label,
                                    }))}
                                />
                            </Form.Item>
                            <Form.Item>
                                <Space>
                                    <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                                    <Button onClick={() => setFilters({})}>重置</Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Card>

                    {/* 备案列表 */}
                    <Card style={{ marginTop: 12 }}>
                        <Table
                            rowKey="id"
                            dataSource={filteredRecords}
                            columns={columns}
                            pagination={{
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total) => `共 ${total} 条`,
                                defaultPageSize: 10,
                                pageSizeOptions: ['10', '20', '50'],
                            }}
                            scroll={{ x: 1400 }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

// ============ 主组件 ============

export default function FilingManagementPage() {
    const [records, setRecords] = useState<FilingRecord[]>(initialFilingRecords);
    const [selectedRecord, setSelectedRecord] = useState<FilingRecord | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const openDrawer = (record: FilingRecord) => {
        setSelectedRecord(record);
        setDrawerOpen(true);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setSelectedRecord(null);
    };

    const handleSaveNodes = (id: string, nodes: ExecutionNode[]) => {
        setRecords((prev) =>
            prev.map((r) => (r.id === id ? { ...r, nodes, projectLevel: selectedRecord?.projectLevel || r.projectLevel } : r))
        );
        // Update selected record for UI consistency
        setSelectedRecord((prev) => prev && prev.id === id ? { ...prev, nodes } : prev);
    };

    const handleAssignExperts = (id: string, selected: { name: string; type: ExpertType; org: string }[]) => {
        const newExperts: ExpertOpinion[] = selected.map((s) => ({
            id: genId(),
            expertName: s.name,
            expertType: s.type,
            expertOrg: s.org,
            status: 'pending' as const,
        }));

        const now = nowString();
        setRecords((prev) =>
            prev.map((r) => {
                if (r.id !== id) return r;
                return {
                    ...r,
                    experts: newExperts,
                    status: 'expert-reviewing' as FilingStatus,
                    approvalHistory: [
                        ...r.approvalHistory,
                        {
                            id: genId(),
                            reviewer: '王审核',
                            reviewerOrg: '中材国际（上级审批）',
                            action: 'expert-assign' as const,
                            remark: `已转 ${selected.filter((s) => s.type === 'expert').length} 位技术专家、${selected.filter((s) => s.type === 'business-domain').length} 位业务域人员评审。`,
                            time: now,
                            level: 1,
                        },
                    ],
                };
            })
        );
        setSelectedRecord((prev) =>
            prev && prev.id === id
                ? {
                      ...prev,
                      experts: newExperts,
                      status: 'expert-reviewing',
                      approvalHistory: [
                          ...prev.approvalHistory,
                          {
                              id: genId(),
                              reviewer: '王审核',
                              reviewerOrg: '中材国际（上级审批）',
                              action: 'expert-assign' as const,
                              remark: `已转 ${selected.filter((s) => s.type === 'expert').length} 位技术专家、${selected.filter((s) => s.type === 'business-domain').length} 位业务域人员评审。`,
                              time: now,
                              level: 1,
                          },
                      ],
                  }
                : prev
        );
        message.success(`已成功分配 ${selected.length} 位评审人员。`);
    };

    const handleApprove = (id: string, remark?: string) => {
        const now = nowString();
        setRecords((prev) =>
            prev.map((r) => {
                if (r.id !== id) return r;
                const isLevel1 = r.reviewLevel === 1;
                return {
                    ...r,
                    status: isLevel1 ? ('approved-level1' as FilingStatus) : ('approved' as FilingStatus),
                    reviewLevel: isLevel1 ? 2 : r.reviewLevel,
                    approvalHistory: [
                        ...r.approvalHistory,
                        {
                            id: genId(),
                            reviewer: '王审核',
                            reviewerOrg: isLevel1 ? '中材国际（二级审批）' : '集团总部（终审）',
                            action: 'approve' as const,
                            remark: remark || '备案信息审核通过，予以批准。',
                            time: now,
                            level: isLevel1 ? 1 : 2,
                        },
                    ],
                };
            })
        );
        message.success('已通过审核。');
        closeDrawer();
    };

    const handleReturn = (id: string, remark: string) => {
        const now = nowString();
        setRecords((prev) =>
            prev.map((r) => {
                if (r.id !== id) return r;
                return {
                    ...r,
                    status: 'returned' as FilingStatus,
                    approvalHistory: [
                        ...r.approvalHistory,
                        {
                            id: genId(),
                            reviewer: '王审核',
                            reviewerOrg: '中材国际（上级审批）',
                            action: 'return' as const,
                            remark,
                            time: now,
                            level: 1,
                        },
                    ],
                };
            })
        );
        message.success('已退回备案申请。');
        closeDrawer();
    };

    return (
        <>
            <FilingManagementList
                records={records}
                onReview={openDrawer}
                onSaveNodes={handleSaveNodes}
                onAssignExperts={handleAssignExperts}
                onApprove={handleApprove}
                onReturn={handleReturn}
            />

            <FilingDetailDrawer
                record={selectedRecord}
                open={drawerOpen}
                onClose={closeDrawer}
                onSaveNodes={handleSaveNodes}
                onAssignExperts={handleAssignExperts}
                onApprove={handleApprove}
                onReturn={handleReturn}
            />
        </>
    );
}
