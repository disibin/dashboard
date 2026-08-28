import NewStaffMemberForm from '@/component/staff/forms/NewStaffMemberForm';

export const metadata = {
  title: 'Add Staff Member | Disibin Management',
  description: 'Create a new staff member account and send an invitation email.',
};

const NewTeamMemberPage = () => {
  return <NewStaffMemberForm />;
};

export default NewTeamMemberPage;
