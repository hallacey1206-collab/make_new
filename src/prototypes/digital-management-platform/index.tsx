/**
 * @name 数字化管理平台原型
 * @mode axure
 */

import React, { useMemo } from 'react';
import { defineHashPageRoute, useHashPage } from '../../common/useHashPage';
import {
    AnnotationViewer,
    type AnnotationDirectoryRouteNode,
    type AnnotationSourceDocument,
    type AnnotationViewerOptions,
} from '@axhub/annotation';
import annotationSource from './annotation-source.json';
import DigitalManagementPlatformApp from './pages';
import './style.css';

const route = defineHashPageRoute(
    [
        { id: 'home', title: '首页' },
        { id: 'plan-fill', title: '投资计划填报' },
        { id: 'plan-review', title: '投资计划审核' },
        { id: 'plan-view', title: '投资计划查看' },
        { id: 'budget-fill', title: '预算填报' },
        { id: 'budget-view', title: '预算查看' },
        { id: 'budget-review', title: '预算审核' },
        { id: 'budget-stat', title: '预算统计' },
        { id: 'filing-management', title: '备案管理' },
        { id: 'expert-database', title: '专家库' },
        { id: 'filing-wecom-msg', title: '企微审批提醒' },
        { id: 'filing-wecom-detail', title: '企微审批详情' },
        { id: 'project-execution', title: '项目执行' },
        { id: 'operation-manual', title: '操作手册' },
    ],
    { defaultPageId: 'home' },
);

export default function Component() {
    const { page, setPage } = useHashPage(route);

    const options = useMemo<AnnotationViewerOptions>(() => ({
        currentPageId: page,
        showToolbar: true,
        showThemeToggle: false,
        showColorFilter: true,
        onDirectoryRoute: (node: AnnotationDirectoryRouteNode) => {
            setPage(node.route);
        },
    }), [page, setPage]);

    return (
        <>
            <DigitalManagementPlatformApp />
            <AnnotationViewer
                source={annotationSource as AnnotationSourceDocument}
                options={options}
            />
        </>
    );
}

