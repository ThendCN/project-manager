import React, { useEffect, useState } from 'react';
import { Tree, Spin, message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { FileOutlined, FolderOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { getProjectFiles } from '../api';
import type { FileNode } from '../types';

interface FileExplorerProps {
  projectName: string;
  onFileSelect: (filePath: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  projectName,
  onFileSelect
}) => {
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    loadFileTree();
  }, [projectName]);

  const loadFileTree = async () => {
    setLoading(true);
    try {
      const result = await getProjectFiles(projectName);
      if (result.success && result.data) {
        const nodes = convertToTreeData([result.data]);
        setTreeData(nodes);
        // 默认展开第一级目录
        if (result.data.children) {
          setExpandedKeys([result.data.path]);
        }
      }
    } catch (error) {
      console.error('加载文件树失败:', error);
      message.error('加载文件树失败');
    } finally {
      setLoading(false);
    }
  };

  const convertToTreeData = (nodes: FileNode[]): DataNode[] => {
    return nodes.map((node) => {
      const isDirectory = node.type === 'directory';
      const hasChildren = node.children && node.children.length > 0;

      return {
        key: node.path || 'root',
        title: node.name,
        icon: isDirectory
          ? ({ expanded }: any) =>
              expanded ? <FolderOpenOutlined /> : <FolderOutlined />
          : <FileOutlined />,
        isLeaf: !isDirectory,
        children: hasChildren ? convertToTreeData(node.children!) : undefined,
        // 在数据节点上存储额外信息
        data: {
          type: node.type,
          size: node.size,
          extension: node.extension
        }
      };
    });
  };

  const handleSelect = (selectedKeys: React.Key[], info: any) => {
    if (selectedKeys.length > 0) {
      const selectedNode = info.node;
      // 只有点击文件才触发选择事件
      if (selectedNode.isLeaf) {
        const filePath = selectedKeys[0] as string;
        setSelectedKeys([filePath]);
        onFileSelect(filePath);
      }
    }
  };

  const handleExpand = (expandedKeys: React.Key[]) => {
    setExpandedKeys(expandedKeys);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '20px'
      }}>
        <Spin tip="加载文件树..." spinning={true}>
          <div style={{ minHeight: '100px' }} />
        </Spin>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      padding: '12px',
      backgroundColor: '#fafafa'
    }}>
      <Tree
        showIcon
        showLine={{ showLeafIcon: false }}
        treeData={treeData}
        selectedKeys={selectedKeys}
        expandedKeys={expandedKeys}
        onSelect={handleSelect}
        onExpand={handleExpand}
        style={{
          backgroundColor: 'transparent',
          fontSize: '13px'
        }}
      />
    </div>
  );
};
