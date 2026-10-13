import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    LeftOutlined,
    RightOutlined,
} from '@ant-design/icons';
import {
    AccountBookOutlined,
    AppstoreOutlined,
    ArrowUpOutlined,
    BookOutlined,
    BranchesOutlined,
    BellOutlined,
    CheckCircleOutlined,
    CloudDownloadOutlined,
    CloudUploadOutlined,
    DashboardOutlined,
    DatabaseOutlined,
    DeleteOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    ExperimentOutlined,
    FolderOpenOutlined,
    CloseOutlined,
    HomeOutlined,
    InfoCircleOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    EllipsisOutlined,
    ProjectOutlined,
    ReloadOutlined,
    SaveOutlined,
    ScheduleOutlined,
    SearchOutlined,
    ShoppingOutlined,
    TeamOutlined,
    TrophyOutlined,
} from '@ant-design/icons';
import {
    Alert,
    App,
    Badge,
    Button,
    Card,
    Checkbox,
    Col,
    ConfigProvider,
    Descriptions,
    Divider,
    Drawer,
    Form,
    Input,
    InputNumber,
    Layout,
    Menu,
    Modal,
    Progress,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tabs,
    Tag,
    Timeline,
    Tree,
    Typography,
    message,
} from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TreeDataNode } from 'antd';
import { defineHashPageRoute, useHashPage } from '../../common/useHashPage';
import {
    accountingOptions,
    buildModeOptions,
    buildTypeOptions,
    businessDomainOptions,
    companyOptions,
    currentPlanYear,
    initialPlanRecords,
    initialBudgetRecords,
    menuGroups,
    orgTreeData,
    pageMeta,
    pageOrder,
    planYearOptions,
    policyDirectionOptions,
    projectCategoryOptions,
    yesNoOptions,
    getNextPlanCode,
    type MenuPageId,
    type PlatformPlanRecord,
    type PlanStatus,
} from './data';
import FilingManagementPage from './filing-management';
import ExpertDatabasePage, { ExpertStoreProvider } from './expert-database';
import BudgetFillPage, { BudgetStoreProvider } from './budget-fill';
import BudgetViewPage from './budget-view';
import BudgetStatPage from './budget-stat';
import BudgetReviewPage from './budget-review';
import FilingWecomMsgPage from './filing-wecom-msg';
import FilingWecomDetailPage from './filing-wecom-detail';
import ProjectExecutionPage from './project-execution';
import OperationManualPage from './operation-manual';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

type StoreContextValue = {
    records: PlatformPlanRecord[];
    saveDraft: (record: PlatformPlanRecord) => void;
    deleteDraft: (id: string) => void;
    submitDrafts: () => void;
    approvePlan: (id: string, remark?: string) => void;
    returnPlan: (id: string, remark: string) => void;
};

const PlatformStoreContext = createContext<StoreContextValue | null>(null);

const route = defineHashPageRoute(pageOrder.map((id) => ({
    id,
    title: pageMeta[id].title,
})), {
    defaultPageId: 'home',
});

const menuIconMap: Record<string, React.ReactNode> = {
    overview: <HomeOutlined />,
    plan: <ScheduleOutlined />,
    budget: <AccountBookOutlined />,
    project: <ProjectOutlined />,
    supplier: <TeamOutlined />,
    resource: <FolderOpenOutlined />,
};

const statusMeta: Record<PlanStatus, { label: string; color: string }> = {
    draft: { label: '草稿', color: 'default' },
    'pending-review': { label: '待审核', color: 'processing' },
    approved: { label: '已审核', color: 'success' },
    completed: { label: '已完结', color: 'success' },
    returned: { label: '退回', color: 'error' },
};

const pageGroupOpenKeyMap: Record<MenuPageId, string> = {
    home: 'home',
    'plan-fill': 'plan',
    'plan-review': 'plan',
    'plan-view': 'plan',
    'budget-fill': 'budget',
    'budget-view': 'budget',
    'budget-review': 'budget',
    'budget-stat': 'budget',
    'budget-plan-fill': 'budget',
    'budget-plan-view': 'budget',
    'budget-execution-fill': 'budget',
    'budget-execution-stat': 'budget',
    'project-filing': 'project',
    'project-execution': 'project',
    'filing-management': 'project',
    'execution-management': 'project',
    'project-change': 'project',
    'change-management': 'project',
    'project-post-eval': 'project',
    'post-eval-management': 'project',
    'supplier-eval': 'project',
    'expert-database': 'resource',
    'resource-sharing': 'resource',
    'filing-wecom-msg': 'project',
    'filing-wecom-detail': 'project',
};

function nowString() {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function formatMoney(value: number) {
    return value.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDate(value?: string) {
    if (!value) {
        return '-';
    }
    return value.slice(0, 10);
}

function getPlanTotal(record: PlatformPlanRecord) {
    return record.selfFunding + record.externalFunding + record.otherFunding;
}

function getTechTotal(record: PlatformPlanRecord) {
    return record.softwareFunding + record.hardwareFunding + record.otherTechFunding;
}

function normalizeSelectedKeys(value: string | string[] | undefined) {
    if (typeof value === 'string') {
        return [value];
    }
    return Array.isArray(value) ? value : [];
}

function findFirstLeafKey(nodes: TreeDataNode[]): string {
    for (const node of nodes) {
        if (node.children && node.children.length > 0) {
            const childKey = findFirstLeafKey(node.children as TreeDataNode[]);
            if (childKey) {
                return childKey;
            }
        } else if (typeof node.key === 'string') {
            return node.key;
        }
    }
    return 'group';
}

function downloadTextFile(filename: string, content: string) {
    if (typeof document === 'undefined') {
        return;
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function buildCsv(records: PlatformPlanRecord[]) {
    const header = ['计划编码', '计划名称', '单位', '项目类别', '业务域分类', '状态', '投资总额', '提交时间', '审核时间'];
    const rows = records.map((record) => [
        record.code,
        record.name,
        record.unitName,
        record.category,
        record.domain,
        statusMeta[record.status].label,
        String(getPlanTotal(record)),
        record.submitTime || '',
        record.reviewTime || '',
    ]);
    return [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');
}

function buildPlanColumns({
    onEdit,
    onDelete,
    onCopy,
    onSubmit,
    canSubmit,
}: {
    onEdit: (record: PlatformPlanRecord) => void;
    onDelete: (record: PlatformPlanRecord) => void;
    onSubmit?: (record: PlatformPlanRecord) => void;
    canSubmit?: boolean;
}): ColumnsType<PlatformPlanRecord> {
    return [
        { title: '计划编码', dataIndex: 'code', width: 110 },
        {
            title: '计划名称',
            dataIndex: 'name',
            width: 160,
            ellipsis: true,
        },
        {
            title: '项目类别',
            dataIndex: 'category',
            width: 150,
            ellipsis: true,
        },
        {
            title: '投资总额(万元)',
            width: 120,
            render: (_, record) => `¥ ${formatMoney(getPlanTotal(record))}`,
        },
        {
            title: '操作',
            width: 140,
            render: (_, record) => (
                <Space size={4} wrap>
                    <Button size="small" type="link" icon={<EditOutlined />} onClick={() => onEdit(record)}>
                        编辑
                    </Button>
                    {canSubmit && onSubmit ? (
                        <Button size="small" type="link" icon={<ArrowUpOutlined />} onClick={() => onSubmit(record)}>
                            提交
                        </Button>
                    ) : null}
                    <Button size="small" type="link" danger icon={<DeleteOutlined />} onClick={() => onDelete(record)}>
                        删除
                    </Button>
                </Space>
            ),
        },
    ];
}

function usePlatformStore() {
    const store = useContext(PlatformStoreContext);
    if (!store) {
        throw new Error('Platform store is missing.');
    }
    return store;
}

function PlatformStoreProvider({ children }: { children: React.ReactNode }) {
    const [records, setRecords] = useState<PlatformPlanRecord[]>(initialPlanRecords);

    const saveDraft = (record: PlatformPlanRecord) => {
        setRecords((current) => {
            const next = current.filter((item) => item.id !== record.id);
            return [record, ...next].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        });
    };

    const deleteDraft = (id: string) => {
        setRecords((current) => current.filter((item) => item.id !== id));
    };

    const submitDrafts = () => {
        setRecords((current) => current.map((item) => {
            if (item.status === 'draft' || item.status === 'returned') {
                return {
                    ...item,
                    status: 'pending-review',
                    submitTime: nowString(),
                    reviewer: undefined,
                    reviewTime: undefined,
                    reviewRemark: undefined,
                    updatedAt: nowString(),
                };
            }
            return item;
        }));
        message.success('投资计划已批量提交，已进入审核流程。');
    };

    const approvePlan = (id: string, remark?: string) => {
        setRecords((current) => current.map((item) => (
            item.id === id
                ? {
                    ...item,
                    status: 'approved',
                    reviewer: '李审核',
                    reviewTime: nowString(),
                    reviewRemark: remark || '同意通过。',
                    updatedAt: nowString(),
                }
                : item
        )));
        message.success('已通过审核。');
    };

    const returnPlan = (id: string, remark: string) => {
        setRecords((current) => current.map((item) => (
            item.id === id
                ? {
                    ...item,
                    status: 'returned',
                    reviewer: '李审核',
                    reviewTime: nowString(),
                    reviewRemark: remark,
                    updatedAt: nowString(),
                }
                : item
        )));
        message.success('已退回并同步回填报列表。');
    };

    const value = useMemo(() => ({
        records,
        saveDraft,
        deleteDraft,
        submitDrafts,
        approvePlan,
        returnPlan,
    }), [records]);

    return (
        <PlatformStoreContext.Provider value={value}>
            {children}
        </PlatformStoreContext.Provider>
    );
}

function PageHero({
    extra,
}: {
    pageId?: MenuPageId;
    extra?: React.ReactNode;
    showSummary?: boolean;
}) {
    if (!extra) {
        return null;
    }
    return (
        <div className="dmp-hero-actions" style={{ marginBottom: 16, textAlign: 'right' }}>
            {extra}
        </div>
    );
}

function OverviewPage() {
    const { records } = usePlatformStore();
    const { setPage } = useHashPage(route);
    const totals = useMemo(() => {
        const draft = records.filter((item) => item.status === 'draft' || item.status === 'returned');
        const pending = records.filter((item) => item.status === 'pending-review');
        const approved = records.filter((item) => item.status === 'approved');
        const totalAmount = records.reduce((sum, item) => sum + getPlanTotal(item), 0);
        return { draft, pending, approved, totalAmount };
    }, [records]);

    const menuCoverage = menuGroups.map((group) => ({
        group: group.title,
        count: group.children.length,
        firstPage: group.children[0]?.title || '-',
    }));

    return (
        <div className="dmp-page-stack">
            <PageHero
                pageId="overview"
                extra={(
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={() => message.info('总览数据已刷新。')}>刷新</Button>
                        <Button type="primary" icon={<DashboardOutlined />} onClick={() => setPage('plan-fill')}>跳转计划管理</Button>
                    </Space>
                )}
            />

            <Row gutter={16}>
                <Col xs={24} md={12} xl={6}><Card><Statistic title="待提交计划" value={totals.draft.length} prefix={<EditOutlined />} /></Card></Col>
                <Col xs={24} md={12} xl={6}><Card><Statistic title="待审核计划" value={totals.pending.length} prefix={<ScheduleOutlined />} /></Card></Col>
                <Col xs={24} md={12} xl={6}><Card><Statistic title="已通过计划" value={totals.approved.length} prefix={<CheckCircleOutlined />} /></Card></Col>
                <Col xs={24} md={12} xl={6}><Card><Statistic title="年度投资总额" value={totals.totalAmount} precision={2} prefix="¥" /></Card></Col>
            </Row>

            <Row gutter={16}>
                <Col xs={24} lg={14}>
                    <Card
                        title="计划管理流程"
                        extra={<Tag color="blue">围绕填报-审核-查看-统计闭环</Tag>}
                    >
                        <Timeline
                            items={[
                                { children: '企业逐条填报或通过模板导入投资计划。' },
                                { children: '提交后进入审核队列，按组织树逐单位查看。' },
                                { children: '审核通过后同步到查看和统计页面。' },
                                { children: '预算模块可在后续页面直接引用通过的计划。' },
                            ]}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={10}>
                    <Card title="菜单覆盖情况">
                        <Space direction="vertical" style={{ width: '100%' }} size={12}>
                            {menuCoverage.map((item) => (
                                <Card key={item.group} size="small" className="dmp-mini-card">
                                    <div className="dmp-mini-card-row">
                                        <Text strong>{item.group}</Text>
                                        <Tag>{item.count} 个页面</Tag>
                                    </div>
                                    <Text type="secondary">首个入口：{item.firstPage}</Text>
                                </Card>
                            ))}
                        </Space>
                    </Card>
                </Col>
            </Row>

            <Card title="业务联动说明">
                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <Alert
                            message="计划管理"
                            description="本次原型重点实现投资计划填报、审核、查看与统计四个页面，字段、流程和状态已按文档落地。"
                            type="info"
                            showIcon
                        />
                    </Col>
                    <Col xs={24} md={8}>
                        <Alert
                            message="预算管理"
                            description="后续预算模块建议直接引用审核通过的计划数据，减少重复录入并保持口径一致。"
                            type="warning"
                            showIcon
                        />
                    </Col>
                    <Col xs={24} md={8}>
                        <Alert
                            message="项目管理"
                            description="项目备案、执行和变更页面可以复用同一后台壳与组织树，保证平台体验统一。"
                            type="success"
                            showIcon
                        />
                    </Col>
                </Row>
            </Card>
        </div>
    );
}

type PlanFormValues = {
    id?: string;
    code: string;
    name: string;
    planYear: string;
    orgKey: string;
    companyLevelTwo: string;
    companyLevelThree: string;
    unitName: string;
    category: string;
    domain: string;
    policyDirection: string;
    policyName: string;
    brief: string;
    goal: string;
    buildMode: string;
    buildType: string;
    inPlan: string;
    planningFileName: string;
    aiEnabled: string;
    bigDataEnabled: string;
    smartManufacturingEnabled: string;
    includedInOtherInvestment: string;
    otherInvestmentName: string;
    startDate: string;
    endDate: string;
    accountingSubject: string;
    selfFunding: number;
    externalFunding: number;
    otherFunding: number;
    softwareFunding: number;
    hardwareFunding: number;
    otherTechFunding: number;
};

function createBlankPlan(sequence: number): PlanFormValues {
    return {
        id: undefined,
        code: getNextPlanCode(sequence),
        name: '',
        planYear: String(currentPlanYear),
        orgKey: '01',
        companyLevelTwo: companyOptions[0]?.label || '',
        companyLevelThree: '天山材料股份有限公司',
        unitName: '信息化管理部',
        category: projectCategoryOptions[0]?.label || '',
        domain: businessDomainOptions[17]?.label || '',
        policyDirection: policyDirectionOptions[0]?.value || '',
        policyName: '集团数字化转型指导意见',
        brief: '',
        goal: '',
        buildMode: buildModeOptions[1]?.value || '',
        buildType: buildTypeOptions[0]?.value || '',
        inPlan: yesNoOptions[0]?.value || '',
        planningFileName: '天山材料十四五数字化规划',
        aiEnabled: '01',
        bigDataEnabled: '02',
        smartManufacturingEnabled: '02',
        includedInOtherInvestment: '01',
        otherInvestmentName: '',
        startDate: `${currentPlanYear}-01-08`,
        endDate: `${currentPlanYear}-12-20`,
        accountingSubject: accountingOptions[0]?.value || '',
        selfFunding: 0,
        externalFunding: 0,
        otherFunding: 0,
        softwareFunding: 0,
        hardwareFunding: 0,
        otherTechFunding: 0,
    };
}

function toFormValues(record: PlatformPlanRecord): PlanFormValues {
    return {
        id: record.id,
        code: record.code,
        name: record.name,
        planYear: record.planYear,
        orgKey: record.orgKey,
        companyLevelTwo: record.companyLevelTwo,
        companyLevelThree: record.companyLevelThree,
        unitName: record.unitName,
        category: record.category,
        domain: record.domain,
        policyDirection: record.policyDirection,
        policyName: record.policyName,
        brief: record.brief,
        goal: record.goal,
        buildMode: record.buildMode,
        buildType: record.buildType,
        inPlan: record.inPlan,
        planningFileName: record.planningFileName,
        aiEnabled: record.aiEnabled,
        bigDataEnabled: record.bigDataEnabled,
        smartManufacturingEnabled: record.smartManufacturingEnabled,
        includedInOtherInvestment: record.includedInOtherInvestment,
        otherInvestmentName: record.otherInvestmentName,
        startDate: record.startDate,
        endDate: record.endDate,
        accountingSubject: record.accountingSubject,
        selfFunding: record.selfFunding,
        externalFunding: record.externalFunding,
        otherFunding: record.otherFunding,
        softwareFunding: record.softwareFunding,
        hardwareFunding: record.hardwareFunding,
        otherTechFunding: record.otherTechFunding,
    };
}

function formValuesToRecord(values: PlanFormValues, existing?: PlatformPlanRecord, nextSequence = 1): PlatformPlanRecord {
    const companyLabel = companyOptions.find((item) => item.value === values.orgKey)?.label || values.companyLevelTwo;
    const now = nowString();
    return {
        id: existing?.id || `plan-new-${Date.now()}`,
        code: existing?.code || values.code || getNextPlanCode(nextSequence),
        name: values.name.trim(),
        planYear: values.planYear,
        orgKey: values.orgKey,
        companyLevelTwo: companyLabel,
        companyLevelThree: values.companyLevelThree.trim(),
        unitName: values.unitName.trim(),
        category: values.category,
        domain: values.domain,
        policyDirection: values.policyDirection,
        policyName: values.policyName.trim(),
        brief: values.brief.trim(),
        goal: values.goal.trim(),
        buildMode: values.buildMode,
        buildType: values.buildType,
        inPlan: values.inPlan,
        planningFileName: values.planningFileName.trim(),
        aiEnabled: values.aiEnabled,
        bigDataEnabled: values.bigDataEnabled,
        smartManufacturingEnabled: values.smartManufacturingEnabled,
        includedInOtherInvestment: values.includedInOtherInvestment,
        otherInvestmentName: values.otherInvestmentName.trim(),
        startDate: values.startDate,
        endDate: values.endDate,
        accountingSubject: values.accountingSubject,
        selfFunding: Number(values.selfFunding || 0),
        externalFunding: Number(values.externalFunding || 0),
        otherFunding: Number(values.otherFunding || 0),
        softwareFunding: Number(values.softwareFunding || 0),
        hardwareFunding: Number(values.hardwareFunding || 0),
        otherTechFunding: Number(values.otherTechFunding || 0),
        status: existing?.status === 'approved' || existing?.status === 'pending-review' ? existing.status : (existing?.status || 'draft'),
        creator: existing?.creator || '计划管理员',
        submitTime: existing?.submitTime,
        reviewTime: existing?.reviewTime,
        reviewRemark: existing?.reviewRemark,
        reviewer: existing?.reviewer,
        updatedAt: now,
    };
}

function BasicFormSection({ form, readonly = false }: { form: any; readonly?: boolean }) {
    const policyDirection = Form.useWatch('policyDirection', form);
    const inPlan = Form.useWatch('inPlan', form);
    const includedInOtherInvestment = Form.useWatch('includedInOtherInvestment', form);

    const policyDisabled = policyDirection === '04';
    const inPlanDisabled = inPlan === '02';
    const otherInvDisabled = includedInOtherInvestment === '02';

    return (
        <Card size="small" title="基础信息">
            <Row gutter={16}>
                <Col xs={24} md={8}>
                    <Form.Item name="code" label="计划编码">
                        <Input disabled />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        name="planYear"
                        label="计划年度"
                        rules={[{ required: true, message: '请选择计划年度。' }]}
                    >
                        <Select options={planYearOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        name="name"
                        label="计划名称"
                        rules={[{ required: true, message: '请输入计划名称。' }]}
                    >
                        <Input maxLength={50} showCount placeholder="全局唯一" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="orgKey"
                        label="集团/股份二级企业简称"
                        rules={[{ required: true, message: '请选择集团/股份二级企业简称。' }]}
                    >
                        <Select options={companyOptions} disabled />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="companyLevelThree"
                        label="集团/股份三级企业简称"
                        rules={[{ required: true, message: '请输入集团/股份三级企业简称。' }]}
                    >
                        <Input maxLength={50} showCount disabled />
                    </Form.Item>
                </Col>
                <Col xs={24} md={24}>
                    <Form.Item
                        name="unitName"
                        label="单位名称"
                        rules={[{ required: true, message: '请输入单位名称。' }]}
                    >
                        <Input maxLength={50} showCount disabled />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item name="category" label="项目类别" rules={[{ required: true }]}>
                        <Select options={projectCategoryOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item name="domain" label="业务域分类" rules={[{ required: true }]}>
                        <Select options={businessDomainOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="policyDirection"
                        label="政策指导方向"
                        rules={[{ required: true }]}
                    >
                        <Select
                            options={policyDirectionOptions}
                            onChange={() => {
                                form.setFieldValue('policyName', '');
                            }}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="policyName"
                        label="政策名称"
                        rules={policyDisabled ? [] : [{ required: true, message: '请输入政策名称。' }]}
                    >
                        <Input maxLength={100} showCount={!readonly} disabled={readonly || policyDisabled || undefined} placeholder={policyDisabled ? '无指导政策时无需填写' : undefined} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item name="buildMode" label="建设模式" rules={[{ required: true }]}>
                        <Select options={buildModeOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item name="buildType" label="建设类型" rules={[{ required: true }]}>
                        <Select options={buildTypeOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24}>
                    <Form.Item
                        name="projectBrief"
                        label="项目简述"
                        rules={[{ required: true, min: 20, max: 500, message: '请输入20~500字符的项目简述。' }]}
                    >
                        <TextArea rows={3} minLength={20} maxLength={500} showCount placeholder="请输入项目简述" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="projectGoal"
                        label="项目目标"
                        rules={[{ required: true, message: '请选择项目目标。' }]}
                    >
                        <Select
                            options={[
                                { value: '1', label: '降低成本' },
                                { value: '2', label: '提高效率' },
                                { value: '3', label: '提升质量' },
                                { value: '4', label: '自主可控' },
                                { value: '5', label: '网络安全' },
                                { value: '6', label: '社会责任' },
                                { value: '7', label: '变革创新' },
                            ]}
                            placeholder="请选择项目目标"
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="goalContent"
                        label="目标内容"
                        rules={[{ required: true, max: 100, message: '请输入最多100字符的目标内容。' }]}
                    >
                        <Input maxLength={100} showCount placeholder="请输入目标内容" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="inPlan"
                        label="是否规划内项目"
                        rules={[{ required: true }]}
                    >
                        <Select
                            options={yesNoOptions}
                            onChange={() => {
                                form.setFieldValue('planningFileName', '');
                            }}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="planningFileName"
                        label="规划文件名称"
                        rules={inPlanDisabled ? [] : [{ required: true, message: '请输入规划文件名称。' }]}
                    >
                        <Input maxLength={100} showCount={!readonly} disabled={readonly || inPlanDisabled || undefined} placeholder={inPlanDisabled ? '非规划内项目时无需填写' : undefined} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="aiEnabled" label="项目是否涉及人工智能" rules={[{ required: true }]}>
                        <Select options={yesNoOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="bigDataEnabled" label="项目是否涉及大数据分析" rules={[{ required: true }]}>
                        <Select options={yesNoOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="smartManufacturingEnabled" label="项目是否涉及智能制造" rules={[{ required: true }]}>
                        <Select options={yesNoOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="includedInOtherInvestment"
                        label="是否包含在其他非数字化投资项目中"
                        rules={[{ required: true }]}
                    >
                        <Select
                            options={yesNoOptions}
                            onChange={() => {
                                form.setFieldValue('otherInvestmentName', '');
                            }}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="otherInvestmentName"
                        label="其它投资项目名称"
                        rules={otherInvDisabled ? [] : [{ required: true, message: '请输入其它投资项目名称。' }]}
                    >
                        <Input maxLength={100} showCount disabled={otherInvDisabled} placeholder={otherInvDisabled ? '不涉及其他项目时无需填写' : undefined} />
                    </Form.Item>
                </Col>
            </Row>
        </Card>
    );
}

function TimelineFundingSection({ form }: { form: any }) {
    return (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Card size="small" title="项目时间规划">
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="startDate"
                            label="启动时间"
                            rules={[{ required: true, message: '请选择启动时间。' }]}
                        >
                            <Input type="date" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="endDate"
                            label="预计完成时间"
                            rules={[{ required: true, message: '请选择预计完成时间。' }]}
                        >
                            <Input type="date" />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item name="accountingSubject" label="会计核算科目" rules={[{ required: true }]}>
                    <Select options={accountingOptions} />
                </Form.Item>
            </Card>

            <Card size="small" title="2026年计划投资额">
                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="selfFunding"
                            label="自有资金"
                            rules={[{ required: true, message: '请输入自有资金。' }]}
                        >
                            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="externalFunding"
                            label="外部资金"
                            rules={[{ required: true, message: '请输入外部资金。' }]}
                        >
                            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="otherFunding"
                            label="其他"
                            rules={[{ required: true, message: '请输入其他资金。' }]}
                        >
                            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>
                <Divider style={{ margin: '8px 0 16px' }} />
                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="softwareFunding"
                            label="软件"
                            rules={[{ required: true, message: '请输入软件资金。' }]}
                        >
                            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="hardwareFunding"
                            label="硬件"
                            rules={[{ required: true, message: '请输入硬件资金。' }]}
                        >
                            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="otherTechFunding"
                            label="其他"
                            rules={[{ required: true, message: '请输入其他技术资金。' }]}
                        >
                            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>
        </Space>
    );
}

function PlanDrawer({
    open,
    onClose,
    onSubmit,
    existing,
    sequence,
}: {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: PlanFormValues) => void;
    existing: PlatformPlanRecord | null;
    sequence: number;
}) {
    const [form] = Form.useForm<PlanFormValues>();

    useEffect(() => {
        if (open) {
            form.setFieldsValue(existing ? toFormValues(existing) : createBlankPlan(sequence));
        }
    }, [existing, form, open, sequence]);

    return (
        <Drawer
            title={existing ? '编辑投资计划' : '新增投资计划'}
            open={open}
            width={1120}
            onClose={onClose}
            destroyOnClose
            extra={
                <Space>
                    <Button onClick={onClose}>取消</Button>
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={() => form.submit()}
                    >
                        保存
                    </Button>
                </Space>
            }
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onSubmit}
                initialValues={existing ? toFormValues(existing) : createBlankPlan(1)}
            >
                <BasicFormSection form={form} />
                <Divider />
                <TimelineFundingSection form={form} />
            </Form>
        </Drawer>
    );
}

function PlanFillPage() {
    const { records, saveDraft, deleteDraft, submitDrafts } = usePlatformStore();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<PlatformPlanRecord | null>(null);
    const [importOpen, setImportOpen] = useState(false);
    const [filters, setFilters] = useState<{ keyword?: string; year?: string; category?: string }>({});
    const draftRecords = records.filter((record) => record.status === 'draft' || record.status === 'returned');
    const filteredDraftRecords = useMemo(() => {
        const keyword = String(filters.keyword || '').trim().toLowerCase();
        const year = String(filters.year || '').trim();
        const category = String(filters.category || '').trim();

        return draftRecords.filter((record) => {
            if (keyword) {
                const combined = [record.name, record.code, record.unitName, record.companyLevelTwo]
                    .join(' ')
                    .toLowerCase();
                if (!combined.includes(keyword)) {
                    return false;
                }
            }
            if (year && !record.code.includes(year)) {
                return false;
            }
            if (category && record.category !== category) {
                return false;
            }
            return true;
        });
    }, [draftRecords, filters]);

    const nextSequence = useMemo(() => {
        const sequences = records
            .map((item) => Number(String(item.code).split('-').pop() || 0))
            .filter((value) => Number.isFinite(value));
        return (Math.max(...sequences, 0) || 0) + 1;
    }, [records]);

    const openCreateDrawer = () => {
        setEditingRecord(null);
        setDrawerOpen(true);
    };

    const openEditDrawer = (record: PlatformPlanRecord) => {
        setEditingRecord(record);
        setDrawerOpen(true);
    };

    const handleSave = (values: PlanFormValues) => {
        const record = formValuesToRecord(values, editingRecord || undefined, nextSequence);
        saveDraft(record);
        message.success(editingRecord ? '计划已保存更新。' : '计划已新增保存。');
        setDrawerOpen(false);
        setEditingRecord(null);
    };

    const handleDelete = (record: PlatformPlanRecord) => {
        Modal.confirm({
            title: '确认删除该投资计划？',
            icon: <ExclamationCircleOutlined />,
            content: '删除后将从填报列表中移除。',
            okText: '删除',
            okButtonProps: { danger: true },
            onOk: () => deleteDraft(record.id),
        });
    };

    const handleDownloadTemplate = () => {
        const templateRows = buildCsv([
            {
                ...initialPlanRecords[0],
                id: 'template',
                code: '自动生成',
                name: '计划名称',
                companyLevelThree: '集团/股份三级企业简称',
                unitName: '单位名称',
                status: 'draft',
            },
        ]);
        downloadTextFile('投资计划导入模板.csv', templateRows);
        message.success('已下载导入模板（CSV 演示版）。');
    };

    const handleImportDemo = () => {
        const record = formValuesToRecord({
            ...createBlankPlan(nextSequence + 1),
            name: '模板导入示例计划',
            companyLevelThree: '模板导入演示公司',
            unitName: '信息化中心',
            brief: '模板导入演示数据。',
            goal: '用于演示导入后进入填报列表。',
            planningFileName: '演示模板',
            otherInvestmentName: '无',
            selfFunding: 80,
            externalFunding: 20,
            otherFunding: 0,
            softwareFunding: 60,
            hardwareFunding: 20,
            otherTechFunding: 20,
        }, undefined, nextSequence + 1);
        saveDraft(record);
        message.success('模板导入成功，已生成一条填报记录。');
        setImportOpen(false);
    };

    const columns = buildPlanColumns({
        onEdit: openEditDrawer,
        onDelete: handleDelete,
    });

    return (
        <div className="dmp-page-stack">
            <Card className="dmp-query-card" bordered={false} data-annotation-id="plan-fill-query">
                <Form
                    layout="inline"
                    className="dmp-query-form"
                    initialValues={{}}
                    onValuesChange={(_, allValues) => setFilters(allValues)}
                >
                    <Form.Item name="keyword" label="计划名称/编码">
                        <Input allowClear placeholder="请输入计划名称或编码" style={{ width: 260 }} />
                    </Form.Item>
                    <Form.Item name="year" label="年度">
                        <Select
                            allowClear
                            placeholder="请选择年度"
                            style={{ width: 140 }}
                            options={Array.from({ length: 10 }, (_, i) => {
                                const year = currentPlanYear + 1 - i;
                                return { value: String(year), label: String(year) };
                            })}
                        />
                    </Form.Item>
                    <Form.Item name="category" label="项目类别">
                        <Select
                            allowClear
                            placeholder="请选择项目类别"
                            style={{ width: 360 }}
                            options={projectCategoryOptions}
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

            <Card
                data-annotation-id="plan-fill-table"
                title={`投资计划填报列表（${filteredDraftRecords.length} 条）`}
                extra={(
                    <Space wrap>
                        <Button icon={<CloudDownloadOutlined />} onClick={handleDownloadTemplate}>模板下载</Button>
                        <Button icon={<CloudUploadOutlined />} onClick={() => setImportOpen(true)}>导入</Button>
                        <Button icon={<ReloadOutlined />} onClick={() => message.success('填报列表已刷新。')}>刷新</Button>
                        <Button type="primary" icon={<ArrowUpOutlined />} onClick={submitDrafts} disabled={draftRecords.length === 0}>
                            提交
                        </Button>
                        <Button type="primary" icon={<ScheduleOutlined />} onClick={openCreateDrawer}>新增</Button>
                    </Space>
                )}
            >
                <Table
                    rowKey="id"
                    dataSource={filteredDraftRecords}
                    columns={columns}
                    pagination={false}
                />
            </Card>

            <PlanDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSubmit={handleSave}
                existing={editingRecord}
                sequence={nextSequence}
            />

            <Modal
                title="模板导入演示"
                open={importOpen}
                onCancel={() => setImportOpen(false)}
                onOk={handleImportDemo}
                okText="生成示例数据"
            >
                <Alert
                    type="warning"
                    showIcon
                    message="当前原型采用模拟导入方式，点击确认后会生成一条新的草稿记录。"
                    style={{ marginBottom: 16 }}
                />
                <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="模板格式">Excel/CSV 模板字段需与计划表单一致</Descriptions.Item>
                    <Descriptions.Item label="字段限制">计划名称 50 字符，政策名称 100 字符，描述 500 字符</Descriptions.Item>
                    <Descriptions.Item label="导入校验">缺少必填字段会被判定为失败</Descriptions.Item>
                </Descriptions>
            </Modal>
        </div>
    );
}

function resolveOptionLabel(value: string | undefined, options: Array<{ value: string; label: string }>) {
    if (!value) return '-';
    const found = options.find((item) => item.value === value);
    return found ? found.label : value;
}

function PlanDetailDescriptions({ record }: { record: PlatformPlanRecord }) {
    const labelStyle: React.CSSProperties = { fontWeight: 600, color: '#333' };
    return (
        <div style={{ paddingTop: 4 }}>
            <Descriptions bordered size="small" column={2} labelStyle={labelStyle}>
                <Descriptions.Item label="计划编码" span={2}>{record.code}</Descriptions.Item>
                <Descriptions.Item label="计划名称" span={2}>{record.name}</Descriptions.Item>
                <Descriptions.Item label="计划年度">{record.planYear}年</Descriptions.Item>
                <Descriptions.Item label="项目类别">{record.category}</Descriptions.Item>
                <Descriptions.Item label="集团/股份二级企业简称" span={2}>{record.companyLevelTwo}</Descriptions.Item>
                <Descriptions.Item label="集团/股份三级企业简称">{record.companyLevelThree}</Descriptions.Item>
                <Descriptions.Item label="单位名称">{record.unitName}</Descriptions.Item>
                <Descriptions.Item label="业务域分类">{resolveOptionLabel(record.domain, businessDomainOptions)}</Descriptions.Item>
                <Descriptions.Item label="政策指导方向">{resolveOptionLabel(record.policyDirection, policyDirectionOptions)}</Descriptions.Item>
                <Descriptions.Item label="政策名称" span={2}>{record.policyName || '-'}</Descriptions.Item>
                <Descriptions.Item label="建设模式">{resolveOptionLabel(record.buildMode, buildModeOptions)}</Descriptions.Item>
                <Descriptions.Item label="建设类型">{resolveOptionLabel(record.buildType, buildTypeOptions)}</Descriptions.Item>
                <Descriptions.Item label="项目简述" span={2}>{record.brief || '-'}</Descriptions.Item>
                <Descriptions.Item label="目标内容" span={2}>{record.goal || '-'}</Descriptions.Item>
                <Descriptions.Item label="是否规划内项目">{resolveOptionLabel(record.inPlan, yesNoOptions)}</Descriptions.Item>
                <Descriptions.Item label="规划文件名称">{record.planningFileName || '-'}</Descriptions.Item>
                <Descriptions.Item label="项目是否涉及人工智能">{resolveOptionLabel(record.aiEnabled, yesNoOptions)}</Descriptions.Item>
                <Descriptions.Item label="项目是否涉及大数据分析">{resolveOptionLabel(record.bigDataEnabled, yesNoOptions)}</Descriptions.Item>
                <Descriptions.Item label="项目是否涉及智能制造">{resolveOptionLabel(record.smartManufacturingEnabled, yesNoOptions)}</Descriptions.Item>
                <Descriptions.Item label="是否包含在其他非数字化投资项目中">{resolveOptionLabel(record.includedInOtherInvestment, yesNoOptions)}</Descriptions.Item>
                <Descriptions.Item label="其它投资项目名称" span={2}>{record.otherInvestmentName || '-'}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions bordered size="small" column={2} labelStyle={labelStyle}>
                <Descriptions.Item label="启动时间">{record.startDate}</Descriptions.Item>
                <Descriptions.Item label="预计完成时间">{record.endDate}</Descriptions.Item>
                <Descriptions.Item label="会计核算科目" span={2}>{resolveOptionLabel(record.accountingSubject, accountingOptions)}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions bordered size="small" column={3} labelStyle={labelStyle} title="2026年计划投资额">
                <Descriptions.Item label="自有资金">¥ {formatMoney(record.selfFunding)}</Descriptions.Item>
                <Descriptions.Item label="外部资金">¥ {formatMoney(record.externalFunding)}</Descriptions.Item>
                <Descriptions.Item label="其他">¥ {formatMoney(record.otherFunding)}</Descriptions.Item>
                <Descriptions.Item label="软件">¥ {formatMoney(record.softwareFunding)}</Descriptions.Item>
                <Descriptions.Item label="硬件">¥ {formatMoney(record.hardwareFunding)}</Descriptions.Item>
                <Descriptions.Item label="其他（技术）">¥ {formatMoney(record.otherTechFunding)}</Descriptions.Item>
            </Descriptions>
        </div>
    );
}

function ReviewDrawer({
    record,
    open,
    onClose,
    onApprove,
    onReturn,
    readonly = false,
    onSubmitComment,
}: {
    record: PlatformPlanRecord | null;
    open: boolean;
    onClose: () => void;
    onApprove?: (remark?: string) => void;
    onReturn?: (remark: string) => void;
    readonly?: boolean;
    onSubmitComment?: (comment: string) => void;
}) {
    const [readonlyForm] = Form.useForm<PlanFormValues>();
    const [activeTab, setActiveTab] = useState('detail');
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState<Array<{ author: string; time: string; content: string }>>([]);
    const [returnModalVisible, setReturnModalVisible] = useState(false);
    const [returnRemark, setReturnRemark] = useState('');

    useEffect(() => {
        if (open && record) {
            readonlyForm.resetFields();
            readonlyForm.setFieldsValue(toFormValues(record));
            setActiveTab('detail');
            setCommentText('');
            setReturnRemark('');
            // 初始化审批记录
            const initialComments: Array<{ author: string; time: string; content: string }> = [];
            if (record.status === 'pending-review' && record.submitTime) {
                initialComments.push({
                    author: record.unitName || '申报单位',
                    time: record.submitTime,
                    content: '提交投资计划，进入审核流程。',
                });
            }
            if (record.status === 'approved' && record.reviewTime && record.reviewer) {
                initialComments.push({
                    author: record.reviewer,
                    time: record.reviewTime,
                    content: `审核通过。${record.reviewRemark ? '意见：' + record.reviewRemark : ''}`,
                });
            }
            if (record.status === 'returned' && record.reviewTime && record.reviewer) {
                initialComments.push({
                    author: record.reviewer,
                    time: record.reviewTime,
                    content: `退回。原因：${record.reviewRemark || '无'}`,
                });
            }
            setComments(initialComments);
        }
    }, [readonlyForm, open, record]);

    const handleSubmitComment = () => {
        if (!commentText.trim()) {
            message.warning('请输入评论内容。');
            return;
        }
        const newComment = {
            author: '当前用户',
            time: nowString(),
            content: commentText.trim(),
        };
        setComments((prev) => [...prev, newComment]);
        onSubmitComment?.(commentText.trim());
        setCommentText('');
        message.success('评论已提交。');
    };

    return (
        <>
        <Drawer
            title={readonly ? '投资计划详情' : '投资计划审核'}
            width={1120}
            open={open}
            onClose={onClose}
            destroyOnClose
            styles={{ body: { display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
            extra={readonly ? (
                <Button onClick={onClose}>关闭</Button>
            ) : (
                <Space>
                    <Button onClick={onClose}>关闭</Button>
                    <Button
                        style={{ backgroundColor: '#1677ff', borderColor: '#1677ff', color: '#fff' }}
                        onClick={() => onApprove?.()}
                    >
                        通过
                    </Button>
                    <Button
                        danger
                        onClick={() => setReturnModalVisible(true)}
                    >
                        退回
                    </Button>
                </Space>
            )}
        >
            {record ? (
                <Tabs
                    style={{ flex: 1, overflow: 'auto' }}
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        {
                            key: 'detail',
                            label: '计划详情',
                            children: readonly ? (
                                <PlanDetailDescriptions record={record} />
                            ) : (
                                <Form form={readonlyForm} layout="vertical" disabled>
                                    <BasicFormSection form={readonlyForm} readonly={readonly} />
                                    <Divider />
                                    <TimelineFundingSection form={readonlyForm} />
                                </Form>
                            ),
                        },
                        {
                            key: 'approval',
                            label: '审批记录',
                            children: (
                                <div>
                                    {comments.length > 0 ? (
                                        <Timeline
                                            items={comments.map((c, idx) => ({
                                                key: idx,
                                                color: idx === comments.length - 1 ? 'blue' : 'gray',
                                                children: (
                                                    <div>
                                                        <div style={{ marginBottom: 4 }}>
                                                            <Text strong>{c.author}</Text>
                                                            <Text type="secondary" style={{ marginLeft: 12, fontSize: 12 }}>{c.time}</Text>
                                                        </div>
                                                        <div>{c.content}</div>
                                                    </div>
                                                ),
                                            }))}
                                        />
                                    ) : (
                                        <div style={{ color: '#999', textAlign: 'center', padding: '32px 0' }}>暂无审批记录</div>
                                    )}
                                </div>
                            ),
                        },
                    ]}
                />
            ) : null}
            {record && record.status !== 'completed' ? (
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, flexShrink: 0, background: '#fff' }}>
                    <Text strong style={{ marginBottom: 8, display: 'block' }}>发表意见或建议</Text>
                    <Input.TextArea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="请输入您的意见或建议..."
                        rows={3}
                        maxLength={500}
                        showCount
                        style={{ marginBottom: 8 }}
                    />
                    <Button
                        type="primary"
                        onClick={handleSubmitComment}
                        disabled={!commentText.trim()}
                    >
                        提交评论
                    </Button>
                </div>
            ) : null}
        </Drawer>
        <Modal
            title="退回计划"
            open={returnModalVisible}
            onCancel={() => { setReturnModalVisible(false); setReturnRemark(''); }}
            onOk={() => {
                if (!returnRemark.trim()) { message.warning('请填写退回原因。'); return; }
                onReturn?.(returnRemark.trim());
                setReturnModalVisible(false);
                setReturnRemark('');
            }}
            okText="确认退回"
            okButtonProps={{ danger: true }}
        >
            <Alert type="warning" showIcon message="退回后，申报单位可修改后重新提交。" style={{ marginBottom: 16 }} />
            <div style={{ marginBottom: 8 }}><Text strong>退回原因：</Text></div>
            <Input.TextArea
                value={returnRemark}
                onChange={(e) => setReturnRemark(e.target.value)}
                placeholder="请填写退回原因和建议..."
                rows={4}
                maxLength={500}
                showCount
            />
        </Modal>
    </>);
}

// 在途计划：审批节点不在当前用户的计划（模拟：以下 id 的计划处于其他审批节点，可属于任意单位）
const transitPlanIds = ['plan-009', 'plan-013', 'plan-018', 'plan-019', 'plan-020'];

function isTransitRecord(record: PlatformPlanRecord) {
    return transitPlanIds.includes(record.id);
}

function PlanReviewPage() {
    const { records, approvePlan, returnPlan } = usePlatformStore();
    const pendingRecords = records.filter((record) => record.status === 'pending-review');
    const [selectedOrgKey, setSelectedOrgKey] = useState('15');
    const [listTab, setListTab] = useState<'review' | 'approved' | 'completed' | 'transit'>('review');
    const [currentRecord, setCurrentRecord] = useState<PlatformPlanRecord | null>(pendingRecords[0] || null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerReadonly, setDrawerReadonly] = useState(false);
    const [filters, setFilters] = useState<{ keyword?: string; year?: string }>({});
    const [includeChildren, setIncludeChildren] = useState(true);
    const [treeSearch, setTreeSearch] = useState('');
    const [treeExpandedKeys, setTreeExpandedKeys] = useState<string[]>(['group']);
    const [treeCollapsed, setTreeCollapsed] = useState(false);
    const [returnModalVisible, setReturnModalVisible] = useState(false);
    const [returnBatchRemark, setReturnBatchRemark] = useState('');
    const [treeColWidth, setTreeColWidth] = useState<number | null>(null);
    const resizingRef = useRef(false);
    const colRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleWindowResize = () => {
            if (colRef.current && treeColWidth) {
                // Clamp to screen bounds on window resize
                setTreeColWidth((prev) => {
                    if (!prev) return null;
                    const maxAllowed = colRef.current!.parentElement?.clientWidth! - 200;
                    return Math.min(prev, Math.max(200, maxAllowed));
                });
            }
        };
        window.addEventListener('resize', handleWindowResize);
        return () => window.removeEventListener('resize', handleWindowResize);
    }, [treeColWidth]);

    useEffect(() => {
        if (!currentRecord || !records.some((item) => item.id === currentRecord.id)) {
            setCurrentRecord(pendingRecords[0] || null);
        }
    }, [currentRecord, pendingRecords, records]);

    const filteredRecords = useMemo(() => {
        const keyword = String(filters.keyword || '').trim().toLowerCase();
        const year = String(filters.year || '').trim();

        // 审核页展示待审核、已审核、已完结、在途四类计划（不含草稿与退回）
        let list = records.filter((record) =>
            record.status === 'pending-review' || record.status === 'approved' || record.status === 'completed'
        );
        if (selectedOrgKey !== 'group') {
            if (includeChildren) {
                list = list.filter((record) => record.orgKey === selectedOrgKey || record.orgKey.startsWith(selectedOrgKey + '-'));
            } else {
                list = list.filter((record) => record.orgKey === selectedOrgKey);
            }
        }
        if (keyword) {
            list = list.filter((record) => {
                const combined = [record.name, record.code, record.unitName, record.companyLevelTwo]
                    .join(' ')
                    .toLowerCase();
                return combined.includes(keyword);
            });
        }
        if (year) {
            list = list.filter((record) => record.code.includes(year));
        }
        return list;
    }, [records, selectedOrgKey, includeChildren, filters]);

    // 将筛选后的记录按状态分为四类：待审核（当前用户可审批）、在途（审批节点不是当前用户）、已审核、已完结
    const reviewRecords = useMemo(() => filteredRecords.filter((r) => r.status === 'pending-review' && !isTransitRecord(r)), [filteredRecords]);
    const transitRecords = useMemo(() => filteredRecords.filter((r) => r.status === 'pending-review' && isTransitRecord(r)), [filteredRecords]);
    const approvedRecords = useMemo(() => filteredRecords.filter((r) => r.status === 'approved'), [filteredRecords]);
    const completedRecords = useMemo(() => filteredRecords.filter((r) => r.status === 'completed'), [filteredRecords]);

    const filterTreeData = (nodes: TreeDataNode[], keyword: string): TreeDataNode[] => {
        const kw = keyword.trim().toLowerCase();
        if (!kw) return nodes;
        return nodes.reduce<TreeDataNode[]>((acc, node) => {
            const title = String(node.title).toLowerCase();
            const filteredChildren = node.children ? filterTreeData(node.children as TreeDataNode[], keyword) : [];
            if (title.includes(kw) || filteredChildren.length > 0) {
                acc.push({
                    ...node,
                    children: filteredChildren.length > 0 ? filteredChildren : node.children,
                });
            }
            return acc;
        }, []);
    };

    const treeData = useMemo(
        () => filterTreeData(orgTreeData as TreeDataNode[], treeSearch),
        [treeSearch],
    );

    const coloredTreeData = useMemo(() => {
        const getNodeColor = (orgKey: string): string | undefined => {
            const orgRecords = records.filter((r) => r.orgKey === orgKey || r.orgKey.startsWith(orgKey + '-'));
            if (orgRecords.length === 0) return undefined;
            const statuses = new Set(orgRecords.map((r) => r.status));
            if (statuses.has('returned')) return '#ff4d4f';
            if (statuses.has('approved')) return '#52c41a';
            if (statuses.has('pending-review')) return '#1677ff';
            return undefined;
        };
        const getChildStats = (node: TreeDataNode): string => {
            if (!node.children || node.children.length === 0) return '';
            const children = node.children as TreeDataNode[];
            const total = children.length;
            const filled = children.filter((child) => {
                const childKey = child.key as string;
                return records.some((r) => r.orgKey === childKey || r.orgKey.startsWith(childKey + '-'));
            }).length;
            return `（${filled}/${total}）`;
        };
        const applyColor = (nodes: TreeDataNode[]): TreeDataNode[] =>
            nodes.map((node) => ({
                ...node,
                title: `${node.title}${getChildStats(node)}`,
                style: { color: getNodeColor(node.key as string) },
                children: node.children ? applyColor(node.children as TreeDataNode[]) : node.children,
            }));
        return applyColor(treeData);
    }, [treeData, records]);

    const expandedKeys = useMemo(() => {
        const kw = treeSearch.trim().toLowerCase();
        if (!kw) return treeExpandedKeys;
        const result: string[] = [];
        const walk = (nodes: TreeDataNode[], parentKeys: string[]) => {
            nodes.forEach((node) => {
                const title = String(node.title).toLowerCase();
                const childKeys = [...parentKeys, node.key as string];
                if (title.includes(kw)) {
                    result.push(...childKeys);
                }
                if (node.children) {
                    walk(node.children as TreeDataNode[], childKeys);
                }
            });
        };
        walk(orgTreeData as TreeDataNode[], []);
        return result;
    }, [treeSearch, treeExpandedKeys]);

    const handleTreeExpand = (keys: React.Key[]) => {
        setTreeExpandedKeys(keys as string[]);
    };

    const openDrawer = (record: PlatformPlanRecord, readonly: boolean) => {
        setCurrentRecord(record);
        setDrawerReadonly(readonly);
        setDrawerOpen(true);
    };

    const handleBatchApprove = () => {
        reviewRecords.forEach((record) => approvePlan(record.id, '计划符合要求，予以通过。'));
    };

    const handleBatchReturnWithRemark = () => {
        if (!returnBatchRemark.trim()) {
            message.warning('请填写退回原因。');
            return;
        }
        reviewRecords.forEach((record) => returnPlan(record.id, returnBatchRemark));
        setReturnModalVisible(false);
        setReturnBatchRemark('');
    };

    const exportReviewRows = () => {
        downloadTextFile(
            `待审核计划导出-${Date.now()}.csv`,
            buildCsv(filteredRecords),
        );
        message.success('已导出当前审核列表数据（CSV 演示版）。');
    };

    const columns: ColumnsType<PlatformPlanRecord> = [
        { title: '计划编码', dataIndex: 'code', width: 150 },
        { title: '计划名称', dataIndex: 'name', width: 240, ellipsis: true },
        {
            title: '单位名称',
            width: 120,
            ellipsis: true,
            render: () => orgTreeData[0]?.children?.find((n) => n.key === selectedOrgKey)?.title || '',
        },
        {
            title: '投资总额(万元)',
            width: 130,
            render: (_, record) => `¥ ${formatMoney(getPlanTotal(record))}`,
        },
        { title: '项目类别', dataIndex: 'category', width: 160, ellipsis: true },
        {
            title: '提交时间',
            dataIndex: 'submitTime',
            width: 150,
        },
        {
            title: '状态',
            width: 100,
            render: (_, record) => {
                if (record.status === 'completed') return <Tag color="success">已完结</Tag>;
                if (record.status === 'approved') return <Tag color="processing">待审批</Tag>;
                return isTransitRecord(record) ? <Tag color="cyan">在途</Tag> : <Tag color="processing">待审核</Tag>;
            },
        },
        {
            title: '操作',
            width: 100,
            fixed: 'right',
            render: (_, record) => {
                const readonly = record.status !== 'pending-review' || isTransitRecord(record);
                return (
                    <Button type="link" size="small" onClick={() => openDrawer(record, readonly)}>详情</Button>
                );
            },
        },
    ];

    return (
        <div className="dmp-page-stack">
            <div style={{ display: 'flex', gap: 16, width: '100%', minWidth: 0, overflow: 'hidden' }}>
                {treeCollapsed ? (
                    <div
                        style={{
                            flex: '0 0 auto',
                            width: 32,
                            position: 'relative',
                            alignSelf: 'stretch',
                        }}
                    >
                        <Button
                            type="text"
                            icon={<MenuUnfoldOutlined />}
                            title="展开组织树"
                            onClick={() => setTreeCollapsed(false)}
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: 12,
                                width: 32,
                                height: 48,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #d9d9d9',
                                borderLeft: 'none',
                                borderTopRightRadius: 6,
                                borderBottomRightRadius: 6,
                                background: '#fff',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                zIndex: 10,
                            }}
                        />
                    </div>
                ) : (
                <div ref={colRef} style={{ width: treeColWidth ?? '25%', flex: '0 0 auto', minWidth: 200, maxWidth: 600, position: 'relative' }}>
                    <Card
                        data-annotation-id="plan-review-tree"
                        className="dmp-card-fill"
                        title={<span style={{ fontWeight: 600, fontSize: 14, lineHeight: '22px', whiteSpace: 'nowrap' }}>组织树</span>}
                        extra={
                            <Space>
                                <Checkbox
                                    checked={includeChildren}
                                    onChange={(e) => setIncludeChildren(e.target.checked)}
                                >
                                    包含下级
                                </Checkbox>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<MenuFoldOutlined />}
                                    title="收起组织树"
                                    onClick={() => setTreeCollapsed(true)}
                                />
                            </Space>
                        }
                    >
                        <Input
                            allowClear
                            placeholder="输入关键字进行过滤"
                            value={treeSearch}
                            onChange={(e) => setTreeSearch(e.target.value)}
                            style={{ marginBottom: 12 }}
                        />
                        <Tree
                            treeData={coloredTreeData}
                            expandedKeys={expandedKeys}
                            selectedKeys={normalizeSelectedKeys(selectedOrgKey)}
                            onExpand={handleTreeExpand}
                            onSelect={(keys) => setSelectedOrgKey((keys[0] as string) || 'group')}
                        />
                    </Card>
                    {/* Resize handle - visible drag bar */}
                    <div
                        style={{
                            position: 'absolute', right: 0, top: 0, bottom: 0, width: 8,
                            cursor: 'col-resize', zIndex: 10,
                            background: 'transparent',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; e.currentTarget.style.borderRight = '2px solid #d9d9d9'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderRight = 'none'; }}
                        onMouseDown={(e) => {
                            const colEl = colRef.current;
                            if (!colEl) return;
                            const startX = e.clientX;
                            const startWidth = colEl.getBoundingClientRect().width;
                            resizingRef.current = true;
                            document.body.style.cursor = 'col-resize';
                            document.body.style.userSelect = 'none';
                            const handleMouseMove = (ev: MouseEvent) => {
                                if (!resizingRef.current) return;
                                const newWidth = Math.max(200, Math.min(600, startWidth + (ev.clientX - startX)));
                                setTreeColWidth(newWidth);
                            };
                            const handleMouseUp = () => {
                                resizingRef.current = false;
                                document.body.style.cursor = '';
                                document.body.style.userSelect = '';
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                            };
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                        }}
                    />
                </div>
                )}
                <div style={{ flex: '1 1 0%', minWidth: 0, overflow: 'hidden' }}>
                    <Card data-annotation-id="plan-review-query" className="dmp-query-card" bordered={false}>
                        <Form
                            layout="inline"
                            className="dmp-query-form"
                            style={{ flexWrap: 'nowrap' }}
                            initialValues={{}}
                            onValuesChange={(_, allValues) => setFilters(allValues)}
                        >
                            <Form.Item name="keyword" label="计划名称/编码">
                                <Input allowClear placeholder="请输入计划名称或编码" style={{ width: 260 }} />
                            </Form.Item>
                            <Form.Item name="year" label="年度">
                                <Select
                                    allowClear
                                    placeholder="请选择年度"
                                    style={{ width: 140 }}
                                    options={Array.from({ length: 10 }, (_, i) => {
                                        const year = currentPlanYear + 1 - i;
                                        return { value: String(year), label: String(year) };
                                    })}
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

                    <Card
                        data-annotation-id="plan-review-table"
                        title="计划审核"
                        style={{ marginTop: 12 }}
                        extra={listTab === 'review' && reviewRecords.length > 0 ? (
                            <Space>
                                <Button icon={<CloudDownloadOutlined />} onClick={exportReviewRows}>导出</Button>
                                <Button
                                    style={{ backgroundColor: '#1677ff', borderColor: '#1677ff', color: '#fff' }}
                                    onClick={handleBatchApprove}
                                >
                                    通过
                                </Button>
                                <Button
                                    danger
                                    onClick={() => setReturnModalVisible(true)}
                                >
                                    退回
                                </Button>
                            </Space>
                        ) : null}
                    >
                        <Tabs
                            activeKey={listTab}
                            onChange={(key) => setListTab(key as 'review' | 'approved' | 'completed' | 'transit')}
                            items={[
                                {
                                    key: 'review',
                                    label: `待我审核（${reviewRecords.length}）`,
                                    children: (
                                        <Table
                                            rowKey="id"
                                            columns={columns}
                                            dataSource={reviewRecords}
                                            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
                                            scroll={{ x: 1200 }}
                                        />
                                    ),
                                },
                                {
                                    key: 'approved',
                                    label: `我已审核（${approvedRecords.length}）`,
                                    children: (
                                        <Table
                                            rowKey="id"
                                            columns={columns}
                                            dataSource={approvedRecords}
                                            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
                                            scroll={{ x: 1200 }}
                                        />
                                    ),
                                },
                                {
                                    key: 'completed',
                                    label: `已完结（${completedRecords.length}）`,
                                    children: (
                                        <Table
                                            rowKey="id"
                                            columns={columns}
                                            dataSource={completedRecords}
                                            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
                                            scroll={{ x: 1200 }}
                                        />
                                    ),
                                },
                                {
                                    key: 'transit',
                                    label: `在途（${transitRecords.length}）`,
                                    children: (
                                        <Table
                                            rowKey="id"
                                            columns={columns}
                                            dataSource={transitRecords}
                                            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
                                            scroll={{ x: 1200 }}
                                        />
                                    ),
                                },
                            ]}
                        />
                    </Card>
                </div>
            </div>

            <ReviewDrawer
                record={currentRecord}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                readonly={drawerReadonly}
                onApprove={drawerReadonly ? undefined : (remark) => {
                    if (currentRecord) {
                        approvePlan(currentRecord.id, remark);
                    }
                    setDrawerOpen(false);
                }}
                onReturn={drawerReadonly ? undefined : (remark) => {
                    if (currentRecord) {
                        returnPlan(currentRecord.id, remark);
                    }
                    setDrawerOpen(false);
                }}
                onSubmitComment={(comment) => {
                    // 在途模式下提交评论，评论已记录在审批记录中
                    console.log('在途计划评论:', currentRecord?.id, comment);
                }}
            />

            {/* Batch return remark modal for plan-review page */}
            <Modal
                title="批量退回"
                open={returnModalVisible}
                onCancel={() => {
                    setReturnModalVisible(false);
                    setReturnBatchRemark('');
                }}
                onOk={handleBatchReturnWithRemark}
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
                    value={returnBatchRemark}
                    onChange={(e) => setReturnBatchRemark(e.target.value)}
                    placeholder="请填写退回原因和建议..."
                    rows={4}
                    maxLength={500}
                    showCount
                />
            </Modal>
        </div>
    );
}

function PlanViewPage() {
    const { records } = usePlatformStore();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<PlatformPlanRecord | null>(null);
    const [selectedOrgKey, setSelectedOrgKey] = useState('15');
    const [form] = Form.useForm<{ planQuery?: string; year?: string }>();
    const [filters, setFilters] = useState<{ planQuery?: string; year?: string }>({ year: String(currentPlanYear) });
    const [includeChildren, setIncludeChildren] = useState(true);
    const [treeSearch, setTreeSearch] = useState('');
    const [treeExpandedKeys, setTreeExpandedKeys] = useState<string[]>(['group']);
    const [treeCollapsed, setTreeCollapsed] = useState(false);

    const planQuery = String(filters.planQuery || '').trim().toLowerCase();
    const year = filters.year || '';

    const filteredRecords = useMemo(() => records.filter((record) => {
        // 查看页展示已提交过的所有状态的计划（待审核、已审核、已完结），不含草稿与退回
        if (record.status === 'draft' || record.status === 'returned') {
            return false;
        }
        if (selectedOrgKey !== 'group') {
            if (includeChildren) {
                if (record.orgKey !== selectedOrgKey && !record.orgKey.startsWith(selectedOrgKey + '-')) {
                    return false;
                }
            } else {
                if (record.orgKey !== selectedOrgKey) {
                    return false;
                }
            }
        }
        if (planQuery) {
            const combined = [record.code, record.name].join(' ').toLowerCase();
            if (!combined.includes(planQuery)) {
                return false;
            }
        }
        if (year) {
            const recordYear = record.startDate ? record.startDate.slice(0, 4) : '';
            if (recordYear !== year) {
                return false;
            }
        }
        return true;
    }), [planQuery, records, year, selectedOrgKey, includeChildren]);

    const handleSearch = () => {
        setFilters(form.getFieldsValue());
    };

    const handleReset = () => {
        form.resetFields();
        form.setFieldsValue({ year: String(currentPlanYear) });
        setFilters({ year: String(currentPlanYear) });
    };

    const openDetail = (record: PlatformPlanRecord) => {
        setCurrentRecord(record);
        setDrawerOpen(true);
    };

    const exportRows = () => {
        downloadTextFile(
            `投资计划查看导出-${Date.now()}.csv`,
            buildCsv(filteredRecords),
        );
        message.success('已导出当前查询结果（CSV 演示版）。');
    };

    const selectedOrgName = useMemo(() => {
        const findTitle = (nodes: TreeDataNode[], key: string): string | null => {
            for (const node of nodes) {
                if (node.key === key) return String(node.title);
                if (node.children) {
                    const found = findTitle(node.children as TreeDataNode[], key);
                    if (found) return found;
                }
            }
            return null;
        };
        return findTitle(orgTreeData as TreeDataNode[], selectedOrgKey) || '全部';
    }, [selectedOrgKey]);

    const columns: ColumnsType<PlatformPlanRecord> = [
        { title: '计划编码', dataIndex: 'code', width: 160, ellipsis: true },
        { title: '计划名称', dataIndex: 'name', width: 200, ellipsis: true },
        { title: '单位名称', width: 140, render: () => selectedOrgName },
        { title: '项目类别', dataIndex: 'category', width: 160, ellipsis: true },
        {
            title: '投资总额(万元)',
            width: 130,
            render: (_, record) => `¥ ${formatMoney(getPlanTotal(record))}`,
        },
        {
            title: '状态',
            width: 100,
            render: (_, record) => {
                if (record.status === 'approved') return <Tag color="success">已审核</Tag>;
                if (record.status === 'completed') return <Tag color="success">已完结</Tag>;
                return <Tag color="processing">待审核</Tag>;
            },
        },
        {
            title: '操作',
            width: 100,
            fixed: 'right',
            render: (_, record) => <Button type="link" size="small" onClick={() => openDetail(record)}>详情</Button>,
        },
    ];

    const filterTreeData = (nodes: TreeDataNode[], keyword: string): TreeDataNode[] => {
        const kw = keyword.trim().toLowerCase();
        if (!kw) return nodes;
        return nodes.reduce<TreeDataNode[]>((acc, node) => {
            const title = String(node.title).toLowerCase();
            const filteredChildren = node.children ? filterTreeData(node.children as TreeDataNode[], keyword) : [];
            if (title.includes(kw) || filteredChildren.length > 0) {
                acc.push({
                    ...node,
                    children: filteredChildren.length > 0 ? filteredChildren : node.children,
                });
            }
            return acc;
        }, []);
    };

    const treeData = useMemo(
        () => filterTreeData(orgTreeData as TreeDataNode[], treeSearch),
        [treeSearch],
    );

    const coloredTreeData = useMemo(() => {
        const getNodeColor = (orgKey: string): string | undefined => {
            const orgRecords = records.filter((r) => r.orgKey === orgKey || r.orgKey.startsWith(orgKey + '-'));
            if (orgRecords.length === 0) return undefined;
            const statuses = new Set(orgRecords.map((r) => r.status));
            if (statuses.has('returned')) return '#ff4d4f';
            if (statuses.has('approved')) return '#52c41a';
            if (statuses.has('pending-review')) return '#1677ff';
            return undefined;
        };
        const getChildStats = (node: TreeDataNode): string => {
            if (!node.children || node.children.length === 0) return '';
            const children = node.children as TreeDataNode[];
            const total = children.length;
            const filled = children.filter((child) => {
                const childKey = child.key as string;
                return records.some((r) => r.orgKey === childKey || r.orgKey.startsWith(childKey + '-'));
            }).length;
            return `（${filled}/${total}）`;
        };
        const applyColor = (nodes: TreeDataNode[]): TreeDataNode[] =>
            nodes.map((node) => ({
                ...node,
                title: `${node.title}${getChildStats(node)}`,
                style: { color: getNodeColor(node.key as string) },
                children: node.children ? applyColor(node.children as TreeDataNode[]) : node.children,
            }));
        return applyColor(treeData);
    }, [treeData, records]);

    const expandedKeys = useMemo(() => {
        const kw = treeSearch.trim().toLowerCase();
        if (!kw) return treeExpandedKeys;
        const result: string[] = [];
        const walk = (nodes: TreeDataNode[], parentKeys: string[]) => {
            nodes.forEach((node) => {
                const title = String(node.title).toLowerCase();
                const childKeys = [...parentKeys, node.key as string];
                if (title.includes(kw)) {
                    result.push(...childKeys);
                }
                if (node.children) {
                    walk(node.children as TreeDataNode[], childKeys);
                }
            });
        };
        walk(orgTreeData as TreeDataNode[], []);
        return result;
    }, [treeSearch, treeExpandedKeys]);

    const handleTreeExpand = (keys: React.Key[]) => {
        setTreeExpandedKeys(keys as string[]);
    };

    return (
        <div className="dmp-page-stack">
            <PageHero pageId="plan-view" />

            <Row gutter={16}>
                {treeCollapsed ? (
                    <Col flex="32px">
                        <div style={{ position: 'relative', height: '100%' }}>
                            <Button
                                type="text"
                                icon={<MenuUnfoldOutlined />}
                                title="展开组织树"
                                onClick={() => setTreeCollapsed(false)}
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 12,
                                    width: 32,
                                    height: 48,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid #d9d9d9',
                                    borderLeft: 'none',
                                    borderTopRightRadius: 6,
                                    borderBottomRightRadius: 6,
                                    background: '#fff',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                    zIndex: 10,
                                }}
                            />
                        </div>
                    </Col>
                ) : (
                <Col xs={24} lg={6}>
                    <Card data-annotation-id="plan-view-tree" className="dmp-card-fill">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontWeight: 600, fontSize: 14, lineHeight: '22px' }}>组织树</span>
                            <Space size={4}>
                                <Checkbox
                                    checked={includeChildren}
                                    onChange={(e) => setIncludeChildren(e.target.checked)}
                                >
                                    包含下级
                                </Checkbox>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<MenuFoldOutlined />}
                                    title="收起组织树"
                                    onClick={() => setTreeCollapsed(true)}
                                />
                            </Space>
                        </div>
                        <Input
                            allowClear
                            placeholder="输入关键字进行过滤"
                            value={treeSearch}
                            onChange={(e) => setTreeSearch(e.target.value)}
                            style={{ marginBottom: 12 }}
                        />
                        <Tree
                            treeData={treeData}
                            expandedKeys={expandedKeys}
                            selectedKeys={normalizeSelectedKeys(selectedOrgKey)}
                            onExpand={handleTreeExpand}
                            onSelect={(keys) => setSelectedOrgKey((keys[0] as string) || 'group')}
                        />
                    </Card>
                </Col>
                )}
                <Col xs={24} lg={18}>
                    <Card
                        data-annotation-id="plan-view-table"
                        title={`投资计划列表（${filteredRecords.length} 条）`}
                        extra={<Button icon={<CloudDownloadOutlined />} onClick={exportRows}>导出</Button>}
                    >
                        <Form
                            form={form}
                            layout="inline"
                            style={{ marginBottom: 16 }}
                            initialValues={{ year: String(currentPlanYear) }}
                        >
                            <Form.Item name="planQuery" label="计划名称/编码">
                                <Input allowClear placeholder="请输入计划名称或编码" style={{ width: 220 }} />
                            </Form.Item>
                            <Form.Item name="year" label="年度">
                                <Select
                                    allowClear
                                    placeholder="请选择年度"
                                    style={{ width: 160 }}
                                    options={Array.from({ length: 10 }, (_, i) => {
                                        const y = currentPlanYear + 1 - i;
                                        return { value: String(y), label: String(y) };
                                    })}
                                />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" onClick={handleSearch}>查询</Button>
                            </Form.Item>
                            <Form.Item>
                                <Button onClick={handleReset}>重置</Button>
                            </Form.Item>
                        </Form>
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
                            scroll={{ x: 1100 }}
                        />
                    </Card>
                </Col>
            </Row>

            <ReviewDrawer
                record={currentRecord}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                readonly
            />
        </div>
    );
}


function PlaceholderPage({ pageId }: { pageId: MenuPageId }) {
    const meta = pageMeta[pageId] || pageMeta['home'];
    const group = menuGroups.find((item) => item.title === meta.group);
    const children = group?.children || [];

    return (
        <div className="dmp-page-stack">
            <PageHero
                pageId={pageId}
                extra={<Tag icon={<InfoCircleOutlined />} color="blue">占位页面</Tag>}
            />

            <Row gutter={16}>
                <Col xs={24} lg={16}>
                    <Card title="页面说明" className="dmp-card-fill">
                        <Alert
                            type="info"
                            showIcon
                            message="当前页面先提供平台级骨架和占位内容，后续可按同样的 Ant Design 结构继续补齐业务细节。"
                        />
                        <Divider />
                        <Paragraph>
                            {meta.summary}
                        </Paragraph>
                        <Paragraph>
                            这类页面建议直接复用同一套组织树、列表筛选、抽屉详情和导出交互，确保整个平台的操作方式统一。
                        </Paragraph>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="同组菜单">
                        <Space direction="vertical" style={{ width: '100%' }} size={12}>
                            {children.map((child) => (
                                <Card key={child.id} size="small">
                                    <Text strong>{child.title}</Text>
                                    <div><Text type="secondary">{child.summary}</Text></div>
                                </Card>
                            ))}
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

function HomePage({ onNavigate }: { onNavigate: (page: MenuPageId) => void }) {
    const { records: planRecords } = useContext(PlatformStoreContext)!;

    // ===== 待办与统计（基于真实计划/预算数据） =====
    const workbench = useMemo(() => {
        // 投资计划统计
        const planTotal = planRecords.length;
        const planDraft = planRecords.filter((r) => r.status === 'draft').length;
        const planPending = planRecords.filter((r) => r.status === 'pending-review').length;
        const planApproved = planRecords.filter((r) => r.status === 'approved').length;
        const planReturned = planRecords.filter((r) => r.status === 'returned').length;
        const planAmount = planRecords.reduce((sum, r) => sum + getPlanTotal(r), 0);

        // 预算统计（基于 initialBudgetRecords）
        const budgetRecords = initialBudgetRecords;
        const budgetTotal = budgetRecords.length;
        const budgetDraft = budgetRecords.filter((r) => r.status === 'draft').length;
        const budgetPending = budgetRecords.filter((r) => r.status === 'pending-review').length;
        const budgetApproved = budgetRecords.filter((r) => r.status === 'approved').length;
        const budgetReturned = budgetRecords.filter((r) => r.status === 'returned').length;
        const budgetAmount = budgetRecords.reduce((sum, r) => sum + (r.totalInvestment || 0), 0);

        // 备案统计（平台备案业务维度）
        const filing = {
            total: 26,
            pending: 8,
            approved: 15,
            returned: 3,
            inProgress: 6,
        };

        // 待办事项（分业务）
        const todos: Array<{ biz: string; page: MenuPageId; title: string; count: number; desc: string }> = [
            { biz: '投资计划', page: 'plan-review', title: '待审核投资计划', count: planPending, desc: '下级单位已提交、待您审核的投资计划' },
            { biz: '投资计划', page: 'plan-fill', title: '被退回的投资计划', count: planReturned, desc: '审核退回、需补充修改后重新提交的计划' },
            { biz: '投资计划', page: 'plan-fill', title: '计划草稿', count: planDraft, desc: '尚未提交的草稿计划' },
            { biz: '预算管理', page: 'budget-review', title: '待审核预算', count: budgetPending, desc: '下级单位已提交、待您审核的预算' },
            { biz: '预算管理', page: 'budget-fill', title: '被退回的预算', count: budgetReturned, desc: '审核退回、需补充修改后重新提交的预算' },
            { biz: '预算管理', page: 'budget-fill', title: '预算草稿', count: budgetDraft, desc: '尚未提交的草稿预算' },
            { biz: '项目管理', page: 'project-filing', title: '待审核备案', count: filing.pending, desc: '下级单位已提交、待您审核的项目备案' },
            { biz: '项目管理', page: 'filing-management', title: '被退回的备案', count: filing.returned, desc: '审核退回、需补充修改后重新提交的备案' },
        ];

        return {
            planTotal, planDraft, planPending, planApproved, planReturned, planAmount,
            budgetTotal, budgetDraft, budgetPending, budgetApproved, budgetReturned, budgetAmount,
            filing, todos,
        };
    }, [planRecords]);

    const bizGroupMap = useMemo(() => {
        const map = new Map<string, typeof workbench.todos>();
        workbench.todos.forEach((t) => {
            const list = map.get(t.biz) || [];
            list.push(t);
            map.set(t.biz, list);
        });
        return map;
    }, [workbench.todos]);

    const handleGoTodo = (page: MenuPageId) => {
        onNavigate(page);
    };

    return (
        <div className="dmp-workbench">
            <div className="dmp-workbench-header">
                <div>
                    <h1 className="dmp-workbench-title">工作台</h1>
                    <p className="dmp-workbench-subtitle">中国建材集团数字化管理平台 · 欢迎回来，张明远</p>
                </div>
                <div className="dmp-workbench-date">{nowString()}</div>
            </div>

            {/* 各业务统计卡片 */}
            <Row gutter={[16, 16]} className="dmp-workbench-stats">
                <Col xs={24} md={8}>
                    <Card className="dmp-stat-card" bordered={false}>
                        <div className="dmp-stat-card-head">
                            <span className="dmp-stat-card-icon" style={{ background: '#fff1f0', color: '#cf1322' }}><ScheduleOutlined /></span>
                            <span className="dmp-stat-card-title">投资计划</span>
                        </div>
                        <div className="dmp-stat-card-total">{workbench.planTotal}<span className="dmp-stat-card-unit">个</span></div>
                        <div className="dmp-stat-card-items">
                            <div className="dmp-stat-item"><span className="dmp-stat-dot" style={{ background: '#d9d9d9' }} />草稿 <b>{workbench.planDraft}</b></div>
                            <div className="dmp-stat-item"><span className="dmp-stat-dot" style={{ background: '#1677ff' }} />待审核 <b>{workbench.planPending}</b></div>
                            <div className="dmp-stat-item"><span className="dmp-stat-dot" style={{ background: '#52c41a' }} />已通过 <b>{workbench.planApproved}</b></div>
                            <div className="dmp-stat-item"><span className="dmp-stat-dot" style={{ background: '#ff4d4f' }} />已退回 <b>{workbench.planReturned}</b></div>
                        </div>
                        <div className="dmp-stat-card-foot">计划总额 <b>¥{formatMoney(workbench.planAmount)}</b> 万元</div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className="dmp-stat-card" bordered={false}>
                        <div className="dmp-stat-card-head">
                            <span className="dmp-stat-card-icon" style={{ background: '#f6ffed', color: '#389e0d' }}><AccountBookOutlined /></span>
                            <span className="dmp-stat-card-title">预算管理</span>
                        </div>
                        <div className="dmp-stat-card-total">{workbench.budgetTotal}<span className="dmp-stat-card-unit">个</span></div>
                        <div className="dmp-stat-card-items">
                            <div className="dmp-stat-item"><span className="dmp-stat-dot" style={{ background: '#d9d9d9' }} />草稿 <b>{workbench.budgetDraft}</b></div>
                            <div className="dmp-stat-item"><span className="dmp-stat-dot" style={{ background: '#1677ff' }} />待审核 <b>{workbench.budgetPending}</b></div>
                            <div className="dmp-stat-item"><span className="dmp-stat-dot" style={{ background: '#52c41a' }} />已通过 <b>{workbench.budgetApproved}</b></div>
                            <div className="dmp-stat-item"><span className="dmp-stat-dot" style={{ background: '#ff4d4f' }} />已退回 <b>{workbench.budgetReturned}</b></div>
                        </div>
                        <div className="dmp-stat-card-foot">预算总额 <b>¥{formatMoney(workbench.budgetAmount)}</b> 万元</div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className="dmp-stat-card" bordered={false}>
                        <div className="dmp-stat-card-head">
                            <span className="dmp-stat-card-icon" style={{ background: '#e6f4ff', color: '#0958d9' }}><ProjectOutlined /></span>
                            <span className="dmp-stat-card-title">项目备案</span>
                        </div>
                        <div className="dmp-stat-card-total">{workbench.filing.total}<span className="dmp-stat-card-unit">个</span></div>
                        <div className="dmp-stat-card-items">
                            <div className="dmp-stat-item"><span className="dmp-stat-dot" style={{ background: '#1677ff' }} />待审核 <b>{workbench.filing.pending}</b></div>
                            <div className="dmp-stat-item"><span className="dmp-stat-dot" style={{ background: '#52c41a' }} />已通过 <b>{workbench.filing.approved}</b></div>
                            <div className="dmp-stat-item"><span className="dmp-stat-dot" style={{ background: '#ff4d4f' }} />已退回 <b>{workbench.filing.returned}</b></div>
                            <div className="dmp-stat-item"><span className="dmp-stat-dot" style={{ background: '#faad14' }} />执行中 <b>{workbench.filing.inProgress}</b></div>
                        </div>
                        <div className="dmp-stat-card-foot">覆盖二级单位 <b>12</b> 家</div>
                    </Card>
                </Col>
            </Row>

            {/* 待办事项 */}
            <Card className="dmp-todo-card" bordered={false}
                title={<span className="dmp-todo-title"><BellOutlined style={{ marginRight: 8 }} />我的待办</span>}
                extra={<span className="dmp-todo-total">共 {workbench.todos.reduce((s, t) => s + t.count, 0)} 项</span>}>
                {Array.from(bizGroupMap.entries()).map(([biz, list]) => (
                    <div className="dmp-todo-group" key={biz}>
                        <div className="dmp-todo-group-label">{biz}</div>
                        <Row gutter={[12, 12]}>
                            {list.map((t) => (
                                <Col xs={24} sm={12} lg={6} key={t.title}>
                                    <div className="dmp-todo-item" onClick={() => handleGoTodo(t.page)}>
                                        <div className="dmp-todo-item-top">
                                            <span className="dmp-todo-item-title">{t.title}</span>
                                            <Badge count={t.count} color={t.count > 0 ? '#cf1322' : '#d9d9d9'} />
                                        </div>
                                        <div className="dmp-todo-item-desc">{t.desc}</div>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </div>
                ))}
            </Card>
        </div>
    );
}

function AppContent() {
    const { page, setPage } = useHashPage(route);
    const meta = pageMeta[page as MenuPageId] || pageMeta['home'];

    // Redirect unknown page IDs to home
    useEffect(() => {
        if (!pageMeta[page as MenuPageId] && page !== 'home') {
            setPage('home');
        }
    }, [page, setPage]);
    const [collapsed, setCollapsed] = useState(false);
    const [isBroken, setIsBroken] = useState(false);
    const [openKeys, setOpenKeys] = useState<string[]>(['plan']);
    const [openTabs, setOpenTabs] = useState<Array<{ id: MenuPageId; title: string }>>([
        { id: 'home', title: '首页' },
    ]);
    const skipMenuSyncRef = useRef(false);
    const tabsScrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const updateScrollState = useCallback(() => {
        const el = tabsScrollRef.current;
        if (!el) return;
        const hasOverflow = el.scrollWidth > el.clientWidth;
        setCanScrollLeft(el.scrollLeft > 1);
        setCanScrollRight(hasOverflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    useLayoutEffect(() => {
        updateScrollState();
    });

    useEffect(() => {
        const el = tabsScrollRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            updateScrollState();
        });
        ro.observe(el);
        const onScroll = () => updateScrollState();
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            ro.disconnect();
            el.removeEventListener('scroll', onScroll);
        };
    }, [updateScrollState]);

    // 自动滚动到最后加入的标签（最右侧）
    const prevTabsLengthRef = useRef(openTabs.length);
    useEffect(() => {
        const el = tabsScrollRef.current;
        if (!el) return;
        if (openTabs.length > prevTabsLengthRef.current) {
            // 有新增标签，滚动到最右侧
            el.scrollTo({ left: el.scrollWidth - el.clientWidth, behavior: 'smooth' });
        }
        prevTabsLengthRef.current = openTabs.length;
    }, [openTabs.length]);

    const handleScrollLeft = () => {
        const el = tabsScrollRef.current;
        if (!el) return;
        el.scrollBy({ left: -200, behavior: 'smooth' });
    };

    const handleScrollRight = () => {
        const el = tabsScrollRef.current;
        if (!el) return;
        el.scrollBy({ left: 200, behavior: 'smooth' });
    };

    useEffect(() => {
        if (skipMenuSyncRef.current) {
            skipMenuSyncRef.current = false;
            return;
        }
        const groupKey = pageGroupOpenKeyMap[page as MenuPageId];
        setOpenKeys(groupKey ? [groupKey] : []);
    }, [page]);

    useEffect(() => {
        setOpenTabs((current) => {
            if (current.some((tab) => tab.id === page)) {
                return current;
            }
            return [...current, { id: page as MenuPageId, title: meta.title }];
        });
    }, [page, meta.title]);

    const selectedKeys = [page];

    const menuItems: MenuProps['items'] = [
        ...menuGroups.filter((group) => group.key !== 'manual').map((group) => ({
            key: group.key,
            icon: menuIconMap[group.icon] || <AppstoreOutlined />,
            label: group.title,
            children: group.children.map((child) => ({
                key: child.id,
                label: child.title,
            })),
        })),
    ];

    const handleTabClick = (tabId: string) => {
        if (tabId === page) {
            return;
        }
        skipMenuSyncRef.current = true;
        setPage(tabId);
    };

    const handleTabClose = (tabId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenTabs((current) => {
            const index = current.findIndex((tab) => tab.id === tabId);
            const next = current.filter((tab) => tab.id !== tabId);
            if (page === tabId) {
                if (next.length > 0) {
                    const newPage = next[Math.max(0, index - 1)]?.id || next[0].id;
                    setPage(newPage);
                } else {
                    setPage('home');
                }
            }
            return next;
        });
    };

    const renderPage = () => {
        switch (page as MenuPageId) {
            case 'home':
                return <HomePage onNavigate={setPage} />;
            case 'plan-fill':
                return <PlanFillPage />;
            case 'plan-review':
                return <PlanReviewPage />;
            case 'plan-view':
                return <PlanViewPage />;
            case 'budget-fill':
                return <BudgetFillPage />;
            case 'budget-view':
                return <BudgetViewPage />;
            case 'budget-stat':
                return <BudgetStatPage />;
            case 'budget-review':
                return <BudgetReviewPage />;
            case 'filing-management':
                return <FilingManagementPage />;
            case 'expert-database':
                return <ExpertDatabasePage />;
            case 'filing-wecom-msg':
                return <FilingWecomMsgPage />;
            case 'filing-wecom-detail':
                return <FilingWecomDetailPage />;
            case 'project-execution':
                return <ProjectExecutionPage />;
            case 'operation-manual':
                return <OperationManualPage />;
            default:
                return <PlaceholderPage pageId={page as MenuPageId} />;
        }
    };

    // H5 企微页面不需要 PC shell 布局，独立渲染（模拟手机预览）
    const isWecomPage = page === 'filing-wecom-msg' || page === 'filing-wecom-detail';

    if (isWecomPage) {
        return (
            <ExpertStoreProvider>
                <BudgetStoreProvider>
                    <PlatformStoreProvider>
                        <App>
                            <div className="dmp-wecom-preview">
                                {renderPage()}
                            </div>
                        </App>
                    </PlatformStoreProvider>
                </BudgetStoreProvider>
            </ExpertStoreProvider>
        );
    }

    return (
        <Layout className="dmp-shell">
            <Sider
                className="dmp-sider"
                width={280}
                collapsedWidth={isBroken ? 0 : 84}
                breakpoint="lg"
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                onBreakpoint={setIsBroken}
                trigger={null}
            >
                <div className={collapsed ? 'dmp-brand is-collapsed' : 'dmp-brand'}>
                    <img src="./assets/logo.png" className="dmp-brand-mark" alt="logo" />
                    {!collapsed ? (
                        <div>
                            <Title level={4}>数字化管理平台</Title>
                            <Text type="secondary">Plan • Budget • Project • Resource</Text>
                        </div>
                    ) : null}
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={selectedKeys}
                    openKeys={openKeys}
                    onOpenChange={(keys) => setOpenKeys(keys as string[])}
                    items={menuItems}
                    onClick={(info) => setPage(String(info.key))}
                    className="dmp-menu"
                />
            </Sider>

            <Layout className="dmp-main">
                <Header className="dmp-header">
                    <div className="dmp-header-row">
                        <div className="dmp-header-left">
                            <Button
                                className="dmp-collapse-btn"
                                type="text"
                                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                                onClick={() => setCollapsed((value) => !value)}
                            />
                            <div className="dmp-top-tabs-wrapper">
                                {canScrollLeft ? (
                                    <button
                                        className="dmp-top-tabs-arrow"
                                        onClick={handleScrollLeft}
                                        aria-label="向左滑动"
                                    >
                                        <LeftOutlined />
                                    </button>
                                ) : null}
                                <div
                                    className="dmp-top-tabs"
                                    role="tablist"
                                    aria-label="页面导航"
                                    ref={tabsScrollRef}
                                >
                                    {openTabs.map((tab) => {
                                        const isActive = tab.id === page;
                                        const isHome = tab.id === 'home';
                                        return (
                                            <div
                                                key={tab.id}
                                                className={isActive ? 'dmp-top-tab is-active' : 'dmp-top-tab'}
                                                onClick={() => handleTabClick(tab.id)}
                                                role="tab"
                                                aria-selected={isActive}
                                            >
                                                <span className="dmp-top-tab-text">{tab.title}</span>
                                                {!isHome ? (
                                                    <span
                                                        className="dmp-top-tab-close"
                                                        onClick={(e) => handleTabClose(tab.id, e)}
                                                        role="button"
                                                        aria-label="关闭"
                                                    >
                                                        <CloseOutlined />
                                                    </span>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                                {canScrollRight ? (
                                    <button
                                        className="dmp-top-tabs-arrow"
                                        onClick={handleScrollRight}
                                        aria-label="向右滑动"
                                    >
                                        <RightOutlined />
                                    </button>
                                ) : null}
                            </div>
                        </div>
                        <div className="dmp-header-right">
                            <span className="dmp-greeting">你好，管理员</span>
                            <Button
                                type="text"
                                className="dmp-icon-btn"
                                icon={<BookOutlined />}
                                onClick={() => setPage('operation-manual')}
                                title="操作手册"
                            />
                            <Badge count={0} size="small">
                                <Button
                                    type="text"
                                    className="dmp-icon-btn"
                                    icon={<BellOutlined />}
                                    onClick={() => message.info('暂无新的系统消息。')}
                                />
                            </Badge>
                            <Button
                                type="text"
                                className="dmp-icon-btn"
                                icon={<EllipsisOutlined />}
                                onClick={() => message.info('更多操作入口可在这里扩展。')}
                            />
                        </div>
                    </div>
                </Header>

                <Content className="dmp-content">
                    <ExpertStoreProvider>
                        <BudgetStoreProvider>
                            <PlatformStoreProvider>
                                <App>
                                    {renderPage()}
                                </App>
                            </PlatformStoreProvider>
                        </BudgetStoreProvider>
                    </ExpertStoreProvider>
                </Content>
            </Layout>
        </Layout>
    );
}

export default function DigitalManagementPlatformApp() {
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#e60012',
                    borderRadius: 8,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
                },
                components: {
                    Layout: {
                        bodyBg: '#f5f7fb',
                        headerBg: '#ffffff',
                        siderBg: '#ffffff',
                    },
                    Menu: {
                        itemHeight: 42,
                    },
                },
            }}
        >
            <AppContent />
        </ConfigProvider>
    );
}
