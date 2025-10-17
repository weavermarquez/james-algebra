export const JAMES_ALGEBRA_PROGRAM = `
% James Algebra core transformations expressed in Tau Prolog.

% enfold(+Form, -Result)
% Wraps a form with an inversion shell: round containing square (or vice versa) containing the original form.
enfold(Form, form(round, [form(square, [Form])])).
enfold(Form, form(square, [form(round, [Form])])).

% clarify(+Form, -Inner)
% Cancels an inversion shell when encountered.
clarify(form(round, [form(square, [Inner])]), Inner).
clarify(form(square, [form(round, [Inner])]), Inner).
`;
