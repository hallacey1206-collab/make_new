/**
 * @name 智能助手
 * @mode axure
 */

import React from 'react';
import { AnnotationViewer } from '@axhub/annotation';
import type { AnnotationSourceDocument } from '@axhub/annotation';
import SmartAssistantApp from './SmartAssistantApp';
import annotationSource from './annotation-source.json';
import './style.css';

// 暴露给 Axure 发布流程
(window as any).__AXHUB_ANNOTATION_SOURCE__ = annotationSource;

export default function Component() {
    return (
        <>
            <SmartAssistantApp />
            <AnnotationViewer
                source={annotationSource as AnnotationSourceDocument}
                options={{
                    currentPageId: 'main',
                    showToolbar: true,
                    showThemeToggle: true,
                    showColorFilter: true,
                }}
            />
        </>
    );
}
