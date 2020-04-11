import test from "ava";
import { Idena, LocalKeyStore } from "../src/index";

test.beforeEach(async t => {
	const privateKey = process.env.PRIVATE_KEY;
	const provider = new LocalKeyStore(privateKey);
	const to = await provider.getAddress();
	const idena = new Idena(provider);
	t.context = { idena, to };
});

test.serial('Transfer should be accepted.', async (t: any) => {
	const { idena, to } = t.context;
	let op = await idena.transfer({ amount: 0.001, to });
	await op.confirmation();
	t.is(op.hash.length, 66);
});

test.serial('Two sequential transfers should be accepted.', async (t: any) => {
	const { idena, to } = t.context;
	let op1 = await idena.transfer({ amount: 0.001, to });
	await op1.confirmation();
	let op2 = await idena.transfer({ amount: 0.001, to });
	await op2.confirmation();
	t.is(op1.hash.length, 66);
	t.is(op2.hash.length, 66);
});

test.serial('Transfer should be rejected due insufficient funds.', async (t: any) => {
	const { idena, to } = t.context;
	const error = await t.throwsAsync(async () => {
		await idena.transfer({ amount: 100_000_000, to });
	});
	t.is(error.message, '{"code":-32000,"message":"insufficient funds"}');
});

test.serial('Bulk transactions should be accepted.', async (t: any) => {
	const { idena, to } = t.context;
	let ops = await idena.bulkTransactions([
		{ amount: 0.001, to },
		{ amount: 0.001, to },
		{ amount: 0.001, to }
	]);
	ops = await Promise.all(ops.map((op: any) => op.confirmation()));
	t.is(ops[0].hash.length, 66);
	t.is(ops[1].hash.length, 66);
	t.is(ops[2].hash.length, 66);
});
