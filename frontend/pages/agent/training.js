import DashboardLayout from '../../components/DashboardLayout';

export default function Training() {
  const topics = [
    { title: 'How to Create Successful Pools', duration: '5 min', icon: '🎯' },
    { title: 'Marketing Your Pools', duration: '8 min', icon: '📢' },
    { title: 'Managing Prize Delivery', duration: '6 min', icon: '🚚' },
    { title: 'Maximizing Your Commission', duration: '10 min', icon: '💰' },
  ];

  return (
    <DashboardLayout title="Agent Training" subtitle="Learn to succeed" icon="🎓" bgGradient="from-purple-500 to-pink-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map((topic, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition">
            <div className="text-3xl mb-2">{topic.icon}</div>
            <h3 className="font-bold">{topic.title}</h3>
            <p className="text-sm text-gray-500">{topic.duration} read</p>
            <button className="mt-3 text-green-600 text-sm">Start Learning →</button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
