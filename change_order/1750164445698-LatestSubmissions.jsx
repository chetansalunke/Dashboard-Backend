const submissions = [
  {
    project: "Enclave IT Park",
    drawing: "Third floor plan",
    submittedBy: "Sharayu Ingle",
    date: "28-11-2024",
    status: "Approved",
  },
];

const LatestSubmissions = () => (
  <div className="bg-white rounded-2xl shadow p-4 mb-4">
    <div className="text-lg font-medium mb-4 text-red-600">2. Latest Submissions</div>
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left font-semibold text-gray-600 border-b">
          <th className="px-4 py-3">Project Name</th>
          <th className="px-4 py-3">Submission</th>
          <th className="px-4 py-3">Submitted by</th>
          <th className="px-4 py-3">Date</th>
          <th className="px-4 py-3">Status</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y">
        {submissions.map((item, idx) => (
          <tr key={idx} className="border-b hover:bg-gray-50">
            <td className="px-4 py-3 text-sm">{item.project}</td>
            <td className="px-4 py-3 text-sm">{item.drawing}</td>
            <td className="px-4 py-3 text-sm">{item.submittedBy}</td>
            <td className="px-4 py-3 text-sm">{item.date}</td>
            <td className="px-4 py-3 text-sm">{item.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default LatestSubmissions;
