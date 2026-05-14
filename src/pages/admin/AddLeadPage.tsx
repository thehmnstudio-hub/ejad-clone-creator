import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddLeadForm } from "@/components/admin/AddLeadForm";

const AddLeadPage = () => (
  <Card>
    <CardHeader><CardTitle>Add Lead</CardTitle></CardHeader>
    <CardContent><AddLeadForm /></CardContent>
  </Card>
);

export default AddLeadPage;
