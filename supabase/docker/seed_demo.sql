insert into teachers (id,email,name)
values ('demo-teacher-001','teacher@synapse.ai','Demo Teacher')
on conflict (id) do nothing;

-- Topics aligned to the KB corpus so the tutor can cite real source material.
insert into classrooms (id,teacher_id,name,description,topics,join_code)
values ('11111111-1111-1111-1111-111111111111','demo-teacher-001','Foundations of CS & Math','A demo class',
        array['Calculus','Linear Algebra','Data Structures','Statistics','Python Programming','Physics'],'DEMO01')
on conflict (id) do update set name=excluded.name, join_code=excluded.join_code, topics=excluded.topics;
