"use client";

import EntryPageHeader from "./EntryPageHeader";

type PageHeaderProps = {
  title: string;
  onBack: () => void;
};

const PageHeader = ({ title, onBack }: PageHeaderProps) => (
  <EntryPageHeader title={title} onBack={onBack} fixed />
);

export default PageHeader;
