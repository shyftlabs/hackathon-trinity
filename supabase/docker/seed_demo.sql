insert into teachers (id,email,name)
values ('demo-teacher-001','teacher@synapse.ai','Demo Teacher')
on conflict (id) do nothing;

insert into classrooms (id,teacher_id,name,description,topics,join_code)
values ('11111111-1111-1111-1111-111111111111','demo-teacher-001','Intro to Biology','A demo class',
        array['Cell Structure','Photosynthesis','DNA Replication','Mitosis'],'DEMO01')
on conflict (id) do update set join_code=excluded.join_code, topics=excluded.topics;
