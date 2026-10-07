begin;
select plan(12);

select has_table('public', 'site_settings', 'site settings are present');
select has_table('public', 'locations', 'location hierarchy is present');
select has_table('public', 'listing_fees', 'fee disclosure rows are present');
select has_table('public', 'listing_reports', 'listing reports are present');
select has_table('public', 'contact_events', 'first-party events are present');
select has_table('public', 'listing_status_events', 'status history is present');
select has_function('public', 'submit_enquiry', array['jsonb'], 'enquiries use a controlled RPC');
select has_function('public', 'submit_listing_report', array['jsonb'], 'reports use a controlled RPC');
select has_function('public', 'admin_transition_listing', array['uuid','text','text'], 'status transitions use a guarded RPC');
select ok((select relrowsecurity from pg_class where oid='public.listing_private'::regclass), 'private listing details have RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.enquiries'::regclass), 'enquiries have RLS enabled');
select ok(not has_table_privilege('anon', 'public.enquiries', 'select'), 'anonymous clients cannot read enquiries');

select * from finish();
rollback;
