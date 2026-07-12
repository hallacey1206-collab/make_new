import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
    ArrowUpOutlined,
    CloudDownloadOutlined,
    CloudUploadOutlined,
    DeleteOutlined,
    EditOutlined,
    ExclamationCircleOutlined,
    SaveOutlined,
    SearchOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import {
    Alert,
    App,
    Button,
    Card,
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
    Table,
    Tabs,
    Tag,
    message,
    Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    accountingOptions,
    buildModeOptions,
    budgetBuildTypeOptions,
    budgetBusinessDomainOptions,
    budgetCategoryOptions,
    budgetProjectCategoryOptions,
    currentPlanYear,
    enterpriseTypeOptions,
    fiveMeasuresCategoryOptions,
    fiveTransformationOptions,
    initialBudgetRecords,
    measureSubItemCascadeMap,
    planProgressOptions,
    projectGoalOptions,
    yesNoOptions,
    getNextBudgetCode,
    getNextBudgetVersion,
    getBudgetStatusLabel,
    getBudgetStatusColor,
    type BudgetRecord,
    type BudgetStatus,
    type BudgetTabType,
} from './data';

const { TextArea } = Input;

// ============ Helpers ============

function nowString() {
    const now = new Date();
    const pad = (v: number) => String(v).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function formatMoney(value: number) {
    return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value?: string) {
    if (!value) return '-';
    return value.slice(0, 10);
}

function downloadTextFile(filename: string, content: string) {
    if (typeof document === 'undefined') return;
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

// ============ Budget Store ============

type BudgetStoreValue = {
    records: BudgetRecord[];
    saveDraft: (record: BudgetRecord) => void;
    deleteDraft: (id: string) => void;
    submitDrafts: () => void;
};

const BudgetStoreContext = createContext<BudgetStoreValue | null>(null);

function useBudgetStore() {
    const store = useContext(BudgetStoreContext);
    if (!store) throw new Error('BudgetStore is missing.');
    return store;
}

export function BudgetStoreProvider({ children }: { children: React.ReactNode }) {
    const [records, setRecords] = useState<BudgetRecord[]>(initialBudgetRecords);

    const saveDraft = (record: BudgetRecord) => {
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
                    status: 'pending-review' as BudgetStatus,
                    submitTime: nowString(),
                    reviewer: undefined,
                    reviewTime: undefined,
                    reviewRemark: undefined,
                    updatedAt: nowString(),
                };
            }
            return item;
        }));
        message.success('预算已批量提交，已进入审核流程。');
    };

    const value = useMemo(() => ({
        records,
        saveDraft,
        deleteDraft,
        submitDrafts,
    }), [records]);

    return (
        <BudgetStoreContext.Provider value={value}>
            {children}
        </BudgetStoreContext.Provider>
    );
}

// ============ Form Values ============

type BudgetFormValues = {
    id?: string;
    budgetCode: string;
    linkedToInvestmentPlan: string;
    investmentPlanName: string;
    projectName: string;
    budgetCategory: string;
    unitName: string;
    enterpriseType: string;
    fiveMeasuresCategory: string;
    measureSubItem: string;
    businessDomain: string;
    fiveTransformation: string;
    projectGoal: string;
    goalContent: string;
    buildMode: string;
    buildType: string;
    accountingSubject: string;
    managedDept: string;
    responsiblePerson: string;
    projectCategory: string;
    projectBrief: string;
    supportSecondCurve: string;
    planProgress: string;
    includedInOtherBudget: string;
    otherBudgetName: string;
    startDate: string;
    endDate: string;
    totalInvestment: number;
    selfFunding: number;
    externalFunding: number;
    otherFunding: number;
    softwareFunding: number;
    hardwareFunding: number;
    otherTechFunding: number;
    tabType: BudgetTabType;
    version: string;
};

function createBlankBudget(sequence: number, tabType: BudgetTabType): BudgetFormValues {
    return {
        id: undefined,
        budgetCode: getNextBudgetCode(sequence),
        linkedToInvestmentPlan: '01',
        investmentPlanName: '集团数字化专项投资计划',
        projectName: '',
        budgetCategory: '01',
        unitName: '信息化管理部',
        enterpriseType: '01',
        fiveMeasuresCategory: '0101',
        measureSubItem: '010101',
        businessDomain: '19',
        fiveTransformation: 'JY',
        projectGoal: '2',
        goalContent: '',
        buildMode: '02',
        buildType: '01',
        accountingSubject: '01',
        managedDept: '',
        responsiblePerson: '',
        projectCategory: '1',
        projectBrief: '',
        supportSecondCurve: '02',
        planProgress: '04',
        includedInOtherBudget: '02',
        otherBudgetName: '',
        startDate: `${currentPlanYear}-01-08`,
        endDate: `${currentPlanYear}-12-20`,
        totalInvestment: 0,
        selfFunding: 0,
        externalFunding: 0,
        otherFunding: 0,
        softwareFunding: 0,
        hardwareFunding: 0,
        otherTechFunding: 0,
        tabType,
        version: 'V1.0',
    };
}

function recordToFormValues(record: BudgetRecord): BudgetFormValues {
    return {
        id: record.id,
        budgetCode: record.budgetCode,
        linkedToInvestmentPlan: record.linkedToInvestmentPlan,
        investmentPlanName: record.investmentPlanName,
        projectName: record.projectName,
        budgetCategory: record.budgetCategory,
        unitName: record.unitName,
        enterpriseType: record.enterpriseType,
        fiveMeasuresCategory: record.fiveMeasuresCategory,
        measureSubItem: record.measureSubItem,
        businessDomain: record.businessDomain,
        fiveTransformation: record.fiveTransformation,
        projectGoal: record.projectGoal,
        goalContent: record.goalContent,
        buildMode: record.buildMode,
        buildType: record.buildType,
        accountingSubject: record.accountingSubject,
        managedDept: record.managedDept,
        responsiblePerson: record.responsiblePerson,
        projectCategory: record.projectCategory,
        projectBrief: record.projectBrief,
        supportSecondCurve: record.supportSecondCurve,
        planProgress: record.planProgress,
        includedInOtherBudget: record.includedInOtherBudget,
        otherBudgetName: record.otherBudgetName,
        startDate: record.startDate,
        endDate: record.endDate,
        totalInvestment: record.totalInvestment,
        selfFunding: record.selfFunding,
        externalFunding: record.externalFunding,
        otherFunding: record.otherFunding,
        softwareFunding: record.softwareFunding,
        hardwareFunding: record.hardwareFunding,
        otherTechFunding: record.otherTechFunding,
        tabType: record.tabType,
        version: record.version,
    };
}

function formValuesToRecord(values: BudgetFormValues, existing?: BudgetRecord, nextSequence = 1): BudgetRecord {
    const now = nowString();
    return {
        id: existing?.id || `budget-new-${Date.now()}`,
        budgetCode: existing?.budgetCode || values.budgetCode || getNextBudgetCode(nextSequence),
        linkedToInvestmentPlan: values.linkedToInvestmentPlan,
        investmentPlanName: values.linkedToInvestmentPlan === '02' ? '' : values.investmentPlanName.trim(),
        projectName: values.projectName.trim(),
        budgetCategory: values.budgetCategory,
        unitName: values.unitName.trim(),
        enterpriseType: values.enterpriseType,
        fiveMeasuresCategory: values.fiveMeasuresCategory,
        measureSubItem: values.measureSubItem,
        businessDomain: values.businessDomain,
        fiveTransformation: values.fiveTransformation,
        projectGoal: values.projectGoal,
        goalContent: values.goalContent.trim(),
        buildMode: values.buildMode,
        buildType: values.buildType,
        accountingSubject: values.accountingSubject,
        managedDept: values.managedDept.trim(),
        responsiblePerson: values.responsiblePerson.trim(),
        projectCategory: values.projectCategory,
        projectBrief: values.projectBrief.trim(),
        supportSecondCurve: values.supportSecondCurve,
        planProgress: values.planProgress,
        includedInOtherBudget: values.includedInOtherBudget,
        otherBudgetName: values.includedInOtherBudget === '02' ? '' : values.otherBudgetName.trim(),
        startDate: values.startDate,
        endDate: values.endDate,
        totalInvestment: Number(values.selfFunding || 0) + Number(values.externalFunding || 0) + Number(values.otherFunding || 0),
        selfFunding: Number(values.selfFunding || 0),
        externalFunding: Number(values.externalFunding || 0),
        otherFunding: Number(values.otherFunding || 0),
        softwareFunding: Number(values.softwareFunding || 0),
        hardwareFunding: Number(values.hardwareFunding || 0),
        otherTechFunding: Number(values.otherTechFunding || 0),
        tabType: values.tabType,
        status: existing?.status === 'approved' || existing?.status === 'pending-review' ? existing.status : (existing?.status || 'draft'),
        version: existing?.version || values.version,
        creator: existing?.creator || '预算管理员',
        submitTime: existing?.submitTime,
        reviewTime: existing?.reviewTime,
        reviewRemark: existing?.reviewRemark,
        reviewer: existing?.reviewer,
        updatedAt: now,
    };
}

// ============ Budget Drawer Form ============

function BudgetBasicSection({ form, tabType }: { form: any; tabType: BudgetTabType }) {
    const linkedToInvestmentPlan = Form.useWatch('linkedToInvestmentPlan', form);
    const fiveMeasuresCategory = Form.useWatch('fiveMeasuresCategory', form);
    const includedInOtherBudget = Form.useWatch('includedInOtherBudget', form);

    const subItemOptions = useMemo(() => {
        if (!fiveMeasuresCategory) return [];
        return measureSubItemCascadeMap[fiveMeasuresCategory] || [];
    }, [fiveMeasuresCategory]);

    const showInvestmentPlan = linkedToInvestmentPlan === '01';
    const showOtherBudgetName = includedInOtherBudget === '01';
    const isOuter = tabType === 'outer';

    return (
        <Card size="small" title="基本信息">
            <Row gutter={16}>
                <Col xs={24} md={8}>
                    <Form.Item name="budgetCode" label="预算编号">
                        <Input disabled />
                    </Form.Item>
                </Col>
                {!isOuter && (
                    <>
                        <Col xs={24} md={8}>
                            <Form.Item
                                name="linkedToInvestmentPlan"
                                label="是否关联投资计划"
                                rules={[{ required: true, message: '请选择是否关联投资计划。' }]}
                            >
                                <Select
                                    options={yesNoOptions}
                                    onChange={() => form.setFieldValue('investmentPlanName', '')}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item
                                name="investmentPlanName"
                                label="投资计划名称"
                                rules={showInvestmentPlan ? [{ required: true, message: '请输入投资计划名称。' }] : []}
                            >
                                <Input
                                    disabled={!showInvestmentPlan}
                                    placeholder={showInvestmentPlan ? undefined : '未关联投资计划时无需填写'}
                                />
                            </Form.Item>
                        </Col>
                    </>
                )}
                <Col xs={24} md={isOuter ? 16 : 8}>
                    <Form.Item
                        name="projectName"
                        label="项目名称"
                        rules={[
                            { required: true, message: '请输入项目名称。' },
                            { min: 10, message: '项目名称至少10个字符。' },
                            { max: 50, message: '项目名称最多50个字符。' },
                        ]}
                    >
                        <Input maxLength={50} showCount placeholder="全局唯一" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="budgetCategory" label="预算分类" rules={[{ required: true }]}>
                        <Select options={budgetCategoryOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={16}>
                    <Form.Item name="unitName" label="单位名称" rules={[{ required: true }]}>
                        <Input disabled />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="enterpriseType" label="企业类型" rules={[{ required: true }]}>
                        <Select options={enterpriseTypeOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="fiveMeasuresCategory" label="五大举措分类/四项保障" rules={[{ required: true }]}>
                        <Select
                            options={fiveMeasuresCategoryOptions}
                            showSearch
                            optionFilterProp="label"
                            onChange={() => {
                                form.setFieldValue('measureSubItem', undefined);
                            }}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="measureSubItem" label="举措/保障细分项" rules={[{ required: true }]}>
                        <Select
                            options={subItemOptions}
                            showSearch
                            optionFilterProp="label"
                            disabled={!fiveMeasuresCategory}
                            placeholder={!fiveMeasuresCategory ? '请先选择举措分类' : undefined}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="businessDomain" label="所属业务域" rules={[{ required: true }]}>
                        <Select options={budgetBusinessDomainOptions} showSearch optionFilterProp="label" />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="fiveTransformation" label="五化" rules={[{ required: true }]}>
                        <Select options={fiveTransformationOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="projectGoal" label="项目目标" rules={[{ required: true }]}>
                        <Select options={projectGoalOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={16}>
                    <Form.Item
                        name="goalContent"
                        label="目标内容"
                        rules={[{ required: true, message: '请输入目标内容。' }, { max: 100, message: '最多100字符。' }]}
                    >
                        <Input maxLength={100} showCount />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="buildMode" label="建设模式" rules={[{ required: true }]}>
                        <Select options={buildModeOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="buildType" label="建设类型" rules={[{ required: true }]}>
                        <Select options={budgetBuildTypeOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="accountingSubject" label="会计核算科目" rules={[{ required: true }]}>
                        <Select options={accountingOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        name="managedDept"
                        label="归口部门"
                        rules={[{ required: true, message: '请输入归口部门。' }, { max: 50 }]}
                    >
                        <Input maxLength={50} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        name="responsiblePerson"
                        label="负责人"
                        rules={[{ required: true, message: '请输入负责人。' }, { max: 50 }]}
                    >
                        <Input maxLength={50} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="projectCategory" label="项目类别" rules={[{ required: true }]}>
                        <Select options={budgetProjectCategoryOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={24}>
                    <Form.Item
                        name="projectBrief"
                        label="项目简述"
                        rules={[
                            { required: true, message: '请输入项目简述。' },
                            { min: 20, message: '项目简述至少20个字符。' },
                            { max: 500, message: '项目简述最多500个字符。' },
                        ]}
                    >
                        <TextArea rows={3} maxLength={500} showCount />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="supportSecondCurve" label="是否支持第二曲线" rules={[{ required: true }]}>
                        <Select options={yesNoOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="planProgress" label={`${currentPlanYear}年项目计划进度`} rules={[{ required: true }]}>
                        <Select options={planProgressOptions} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item name="includedInOtherBudget" label="是否已包含在其他预算中" rules={[{ required: true }]}>
                        <Select
                            options={yesNoOptions}
                            onChange={() => form.setFieldValue('otherBudgetName', '')}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                    <Form.Item
                        name="otherBudgetName"
                        label="其他预算名称"
                        rules={showOtherBudgetName ? [{ required: true, message: '请输入其他预算名称。' }, { max: 50 }] : [{ max: 50 }]}
                    >
                        <Input
                            maxLength={50}
                            disabled={!showOtherBudgetName}
                            placeholder={showOtherBudgetName ? undefined : '未包含在其他预算中时无需填写'}
                        />
                    </Form.Item>
                </Col>
            </Row>
        </Card>
    );
}

function BudgetTimeFundingSection({ form }: { form: any }) {
    const selfFunding = Form.useWatch('selfFunding', form) || 0;
    const externalFunding = Form.useWatch('externalFunding', form) || 0;
    const otherFunding = Form.useWatch('otherFunding', form) || 0;
    const softwareFunding = Form.useWatch('softwareFunding', form) || 0;
    const hardwareFunding = Form.useWatch('hardwareFunding', form) || 0;
    const otherTechFunding = Form.useWatch('otherTechFunding', form) || 0;

    const fundingTotal = Number(selfFunding) + Number(externalFunding) + Number(otherFunding);
    const techTotal = Number(softwareFunding) + Number(hardwareFunding) + Number(otherTechFunding);

    return (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Card size="small" title="时间信息">
                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="startDate"
                            label="项目启动时间"
                            rules={[{ required: true, message: '请选择项目启动时间。' }]}
                        >
                            <Input type="date" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            name="endDate"
                            label="项目预计完成时间"
                            rules={[{ required: true, message: '请选择项目预计完成时间。' }]}
                        >
                            <Input type="date" />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Card size="small" title="资金信息">
                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="totalInvestment"
                            label="项目计划总投入（万元）"
                        >
                            <InputNumber
                                min={0}
                                precision={2}
                                style={{ width: '100%' }}
                                disabled
                                value={fundingTotal}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Divider orientation="left" style={{ margin: '8px 0 16px', fontSize: 13 }}>
                    本年计划投资总额（万元）：{formatMoney(fundingTotal)}
                </Divider>
                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="selfFunding"
                            label="自有资金（万元）"
                            rules={[{ required: true, message: '请输入自有资金。' }]}
                        >
                            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="externalFunding"
                            label="外部资金（万元）"
                            rules={[{ required: true, message: '请输入外部资金。' }]}
                        >
                            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="otherFunding"
                            label="其他（万元）"
                            rules={[{ required: true, message: '请输入其他资金。' }]}
                        >
                            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>
                <Divider orientation="left" style={{ margin: '8px 0 16px', fontSize: 13 }}>
                    其中：{formatMoney(techTotal)} 万元
                </Divider>
                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="softwareFunding"
                            label="软件（万元）"
                            rules={[{ required: true, message: '请输入软件资金。' }]}
                        >
                            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="hardwareFunding"
                            label="硬件（万元）"
                            rules={[{ required: true, message: '请输入硬件资金。' }]}
                        >
                            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                        <Form.Item
                            name="otherTechFunding"
                            label="其他（万元）"
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

function BudgetDrawer({
    open,
    onClose,
    onSubmit,
    existing,
    sequence,
    tabType,
}: {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: BudgetFormValues) => void;
    existing: BudgetRecord | null;
    sequence: number;
    tabType: BudgetTabType;
}) {
    const [form] = Form.useForm<BudgetFormValues>();

    useEffect(() => {
        if (open) {
            if (existing) {
                form.setFieldsValue(recordToFormValues(existing));
            } else {
                const blank = createBlankBudget(sequence, tabType);
                // For outer tab, remove investment plan fields
                if (tabType === 'outer') {
                    blank.linkedToInvestmentPlan = '02';
                    blank.investmentPlanName = '';
                }
                form.setFieldsValue(blank);
            }
        }
    }, [existing, form, open, sequence, tabType]);

    const currentTabType = existing?.tabType || tabType;

    return (
        <Drawer
            title={existing ? '编辑预算' : '新增预算'}
            open={open}
            width={1120}
            onClose={onClose}
            destroyOnClose
            extra={
                <Space>
                    <Button onClick={onClose}>取消</Button>
                    <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()}>
                        保存
                    </Button>
                </Space>
            }
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onSubmit}
            >
                <BudgetBasicSection form={form} tabType={currentTabType} />
                <Divider />
                <BudgetTimeFundingSection form={form} />
            </Form>
        </Drawer>
    );
}

// ============ Budget Fill Page ============

function BudgetFillPage() {
    const { records, saveDraft, deleteDraft, submitDrafts } = useBudgetStore();
    const [activeTab, setActiveTab] = useState<BudgetTabType>('inner');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<BudgetRecord | null>(null);
    const [importOpen, setImportOpen] = useState(false);
    const [filters, setFilters] = useState<{ keyword?: string; year?: string }>({ year: `${currentPlanYear}年` });

    const draftRecords = records.filter(
        (record) => (record.status === 'draft' || record.status === 'returned') && record.tabType === activeTab,
    );

    const filteredDraftRecords = useMemo(() => {
        const keyword = String(filters.keyword || '').trim().toLowerCase();
        const year = String(filters.year || '').replace('年', '').trim();

        return draftRecords.filter((record) => {
            if (keyword) {
                const combined = [record.projectName, record.budgetCode, record.unitName]
                    .join(' ')
                    .toLowerCase();
                if (!combined.includes(keyword)) return false;
            }
            if (year && !record.budgetCode.includes(year)) return false;
            return true;
        });
    }, [draftRecords, filters]);

    const nextSequence = useMemo(() => {
        const sequences = records
            .map((item) => Number(String(item.budgetCode).split('-').pop() || 0))
            .filter((v) => Number.isFinite(v));
        return (Math.max(...sequences, 0) || 0) + 1;
    }, [records]);

    const openCreateDrawer = () => {
        setEditingRecord(null);
        setDrawerOpen(true);
    };

    const openEditDrawer = (record: BudgetRecord) => {
        setEditingRecord(record);
        setDrawerOpen(true);
    };

    const handleSave = (values: BudgetFormValues) => {
        const record = formValuesToRecord(values, editingRecord || undefined, nextSequence);
        saveDraft(record);
        message.success(editingRecord ? '预算已保存更新。' : '预算已新增保存。');
        setDrawerOpen(false);
        setEditingRecord(null);
    };

    const handleDelete = (record: BudgetRecord) => {
        Modal.confirm({
            title: '确认删除该预算？',
            icon: <ExclamationCircleOutlined />,
            content: '删除后将从填报列表中移除。',
            okText: '删除',
            okButtonProps: { danger: true },
            onOk: () => deleteDraft(record.id),
        });
    };

    const handleDownloadTemplate = () => {
        const header = ['预算编号', '项目名称', '单位名称', '预算分类', '建设模式', '建设类型', '项目简述', '项目启动时间', '项目预计完成时间', '总额(万元)', '版本号'];
        const sampleRow = ['自动生成', '项目名称', '单位名称', '项目类', '集团统筹', '新建', '项目简述', `${currentPlanYear}-01-01`, `${currentPlanYear}-12-31`, '100.00', 'V1.0'];
        const content = [header.join(','), sampleRow.join(',')].join('\n');
        downloadTextFile('预算导入模板.csv', content);
        message.success('已下载导入模板（CSV 演示版）。');
    };

    const handleImportDemo = () => {
        const record = formValuesToRecord({
            ...createBlankBudget(nextSequence + 1, activeTab),
            projectName: '模板导入示例预算项目',
            unitName: '信息化中心',
            projectBrief: '模板导入演示数据，用于验证批量导入功能是否正常工作。',
            goalContent: '验证导入功能',
            managedDept: '数字化管理部',
            responsiblePerson: '李导入',
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

    const handleExport = () => {
        const header = ['预算编号', '项目名称', '单位名称', '预算分类', '建设模式', '建设类型', '项目简述', '启动时间', '预计完成时间', '总额(万元)', '版本号', '状态'];
        const rows = filteredDraftRecords.map((record) => [
            record.budgetCode,
            record.projectName,
            record.unitName,
            record.budgetCategory === '01' ? '项目类' : '非项目类',
            record.buildMode,
            record.buildType,
            record.projectBrief,
            record.startDate,
            record.endDate,
            String(record.totalInvestment),
            record.version,
            getBudgetStatusLabel(record.status),
        ]);
        const content = [header, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        downloadTextFile(`预算填报导出-${Date.now()}.csv`, content);
        message.success('已导出当前填报列表（CSV 演示版）。');
    };

    const isInnerTab = activeTab === 'inner';

    const columns: ColumnsType<BudgetRecord> = [
        {
            title: '序号',
            width: 60,
            render: (_, __, index) => index + 1,
        },
        {
            title: '项目名称',
            dataIndex: 'projectName',
            width: 180,
            ellipsis: true,
            fixed: 'left',
        },
        {
            title: '单位名称',
            dataIndex: 'unitName',
            width: 120,
            ellipsis: true,
        },
        {
            title: '预算分类',
            dataIndex: 'budgetCategory',
            width: 90,
            render: (val: string) => val === '01' ? '项目类' : '非项目类',
        },
        {
            title: '建设模式',
            dataIndex: 'buildMode',
            width: 100,
            render: (val: string) => buildModeOptions.find((o) => o.value === val)?.label?.split(' | ')[1] || val,
        },
        {
            title: '建设类型',
            dataIndex: 'buildType',
            width: 80,
            render: (val: string) => budgetBuildTypeOptions.find((o) => o.value === val)?.label?.split(' | ')[1] || val,
        },
        {
            title: '项目简述',
            dataIndex: 'projectBrief',
            width: 160,
            ellipsis: true,
        },
        {
            title: '项目启动时间',
            dataIndex: 'startDate',
            width: 120,
            render: formatDate,
        },
        {
            title: '项目预计完成时间',
            dataIndex: 'endDate',
            width: 140,
            render: formatDate,
        },
        {
            title: '总额(万元)',
            dataIndex: 'totalInvestment',
            width: 110,
            render: (val: number) => `¥ ${formatMoney(val)}`,
        },
        {
            title: '版本号',
            dataIndex: 'version',
            width: 80,
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 90,
            fixed: 'right',
            render: (status: BudgetStatus) => (
                <Tag color={getBudgetStatusColor(status)}>{getBudgetStatusLabel(status)}</Tag>
            ),
        },
        {
            title: '操作',
            width: 120,
            fixed: 'right',
            render: (_, record) => (
                <Space size={4}>
                    <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEditDrawer(record)}>
                        编辑
                    </Button>
                    <Button size="small" type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
                        删除
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="dmp-page-stack">
            <Card className="dmp-query-card" bordered={false}>
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key as BudgetTabType)}
                    items={[
                        {
                            key: 'inner',
                            label: '本年预算内预算填报',
                        },
                        {
                            key: 'outer',
                            label: '本年预算外预算填报',
                        },
                    ]}
                />
                <Form
                    layout="inline"
                    className="dmp-query-form"
                    initialValues={{ year: `${currentPlanYear}年` }}
                    onValuesChange={(_, allValues) => setFilters(allValues)}
                >
                    <Form.Item name="keyword" label="项目名称">
                        <Input allowClear placeholder="请输入项目名称" style={{ width: 220 }} />
                    </Form.Item>
                    <Form.Item name="year" label="年度">
                        <Select
                            allowClear
                            placeholder="请选择年度"
                            style={{ width: 140 }}
                            options={Array.from({ length: 5 }, (_, i) => {
                                const year = currentPlanYear + 1 - i;
                                return { value: `${year}年`, label: `${year}年` };
                            })}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" icon={<SearchOutlined />}>查询</Button>
                            <Button onClick={() => setFilters({ year: `${currentPlanYear}年` })}>重置</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>

            <Card
                title={
                    <Space size={6}>
                        {`${activeTab === 'inner' ? '本年预算内' : '本年预算外'}预算填报列表（${filteredDraftRecords.length} 条）`}
                        <Tooltip
                            title={
                                <div style={{ whiteSpace: 'pre-line' }}>
                                    {'1、预算项目(XXXXXXXX)未关联投资计划\n2、预算项目(XXXXXXXX)总额超过了关联投资计划金额'}
                                </div>
                            }
                        >
                            <WarningOutlined style={{ color: '#faad14', fontSize: 16, cursor: 'pointer' }} />
                        </Tooltip>
                    </Space>
                }
                extra={
                    <Space wrap>
                        <Button type="primary" icon={<ArrowUpOutlined />} onClick={() => {
                            Modal.confirm({
                                title: '风险提示',
                                icon: <WarningOutlined style={{ color: '#faad14' }} />,
                                content: (
                                    <div>
                                        <p>以下预算项目存在风控问题，请确认后继续：</p>
                                        <p>1、预算项目(XXXXXXXX)未关联投资计划</p>
                                        <p>2、预算项目(XXXXXXXX)总额超过了关联投资计划金额</p>
                                    </div>
                                ),
                                okText: '继续提交',
                                cancelText: '取消',
                                onOk: submitDrafts,
                            });
                        }} disabled={draftRecords.length === 0}>
                            提交
                        </Button>
                        <Button type="primary" icon={<EditOutlined />} onClick={openCreateDrawer}>
                            新增
                        </Button>
                        <Button icon={<CloudDownloadOutlined />} onClick={handleDownloadTemplate}>
                            模板下载
                        </Button>
                        {isInnerTab && (
                            <Button icon={<CloudUploadOutlined />} onClick={() => setImportOpen(true)}>
                                导入
                            </Button>
                        )}
                        <Button icon={<CloudDownloadOutlined />} onClick={handleExport}>
                            导出
                        </Button>
                    </Space>
                }
            >
                <Table
                    rowKey="id"
                    dataSource={filteredDraftRecords}
                    columns={columns}
                    pagination={{
                        showSizeChanger: true,
                        showTotal: (total) => `共 ${total} 条`,
                        defaultPageSize: 10,
                    }}
                    scroll={{ x: 1600 }}
                />
            </Card>

            <BudgetDrawer
                open={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    setEditingRecord(null);
                }}
                onSubmit={handleSave}
                existing={editingRecord}
                sequence={nextSequence}
                tabType={activeTab}
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
                    <Descriptions.Item label="模板格式">Excel/CSV 模板字段需与预算表单一致</Descriptions.Item>
                    <Descriptions.Item label="导入范围">仅"本年预算内预算填报"支持批量导入</Descriptions.Item>
                    <Descriptions.Item label="导入校验">缺少必填字段会被判定为失败</Descriptions.Item>
                </Descriptions>
            </Modal>
        </div>
    );
}

export default BudgetFillPage;
