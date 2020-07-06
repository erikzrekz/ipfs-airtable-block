import {
    initializeBlock,
    useBase,
    useRecords,
    Loader,
    Button,
    Box,
    Heading,
    Text,
    TablePicker,
    SelectButtons,
    FormField,
    Input,
    Link
} from '@airtable/blocks/ui';
import { _ } from 'underscore';
import { _add, _get }  from './infura'
import React, { useState, Fragment } from 'react';

const MAX_RECORDS_PER_UPDATE = 50;

async function createRecordsInBatchesAsync(table, updates) {
    let i = 0;
    while (i < updates.length) {
        console.log(updates);
        const updateBatch = updates.slice(i, i + MAX_RECORDS_PER_UPDATE);
        await table.createRecordsAsync(updateBatch);
        i += MAX_RECORDS_PER_UPDATE;
    }
}

const options = [
  { value: "to_ipfs", label: "To IPFS" },
  { value: "from_ipfs", label: "From IPFS" }
];


function IpfsBlock() {
    const base = useBase();
    const table = base.getTableByName('Sync');
    const permissionCheck = table.checkPermissionsForUpdateRecord(undefined, {});
    let tableFields = table.fields;
    let records = useRecords(table, {fields: tableFields});

    const [syncDirection, setSyncDirection] = useState(options[0].value);
    const [isSyncInProgress, setIsSyncInProgress] = useState(false);
    const [syncHashValue, setSyncHashValue] = useState('');
    const [syncedResponse, setSyncedResponse] = useState('');

    async function syncTable() {
        setIsSyncInProgress(true)

        if (syncDirection === 'from_ipfs' && syncHashValue) {

            let ipfsRecords = await _get(syncHashValue)
            createRecordsInBatchesAsync(table, ipfsRecords)
            setSyncedResponse(ipfsRecords.Data)

        } else {
            let recordsToSync = [];

            let tableFieldNames = _.map(tableFields, (iter) => iter.name)

            for (var i in records) {
                let record = records[i];
                let values = _.map(tableFields, (iter) => record.getCellValueAsString(iter))
                let recordObject = _.object(tableFieldNames, values)
                recordsToSync.push(recordObject)
            }

            let ipfsHash = await _add(recordsToSync)
            setSyncedResponse(ipfsHash)
        }

        setIsSyncInProgress(false)
    }

    return (
        <Box height={500} maxWidth={600} margin="20px auto" display="flex" flexDirection="row">
            <Box flex="auto" padding={2}>
                <Heading>IPFS Sync</Heading>
                <Text> Name your main table "Sync" </Text>
                <br/>
                <FormField label="Pick the sync direction">
                    <SelectButtons
                          value={syncDirection}
                          options={options}
                          width="320px"
                          onChange={event => setSyncDirection(event)}/>
                </FormField>
                {syncDirection === 'from_ipfs' ? (
                        <FormField label="IPFS Hash">
                            <Input
                                  value={syncHashValue}
                                  onChange={e => setSyncHashValue(e.target.value)}
                                  placeholder="IPFS Value"
                                />
                        </FormField>
                    ) : (
                        <Text></Text>
                    ) }
                {isSyncInProgress ? (
                        <Loader />
                    ) : (
                        <Fragment>
                            <Button
                                variant="primary"
                                onClick={syncTable}
                                disabled={!permissionCheck.hasPermission && !table}
                                shouldAllowPickingNone={false}
                                marginBottom={3}
                                icon="publish"
                            >
                                Sync with IPFS
                            </Button>
                            {!permissionCheck.hasPermission &&
                                permissionCheck.reasonDisplayString}
                        </Fragment>
                    )}
                {syncedResponse ? (
                        <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                            border="thick"
                            backgroundColor="lightGray3"
                            padding={'10px'}
                            overflow="hidden"
                          >
                            <Heading variant="caps" size="small">IPFS Details</Heading>
                            <Text>Hash: {syncedResponse}</Text>
                            <br />
                            <Link href={`https://cloudflare-ipfs.com/ipfs/${syncedResponse}`} target="_blank" icon="public">Link</Link>
                          </Box>
                    ): (
                        <Text></Text>
                    )}
            </Box>
        </Box>
    );
}

initializeBlock(() => < IpfsBlock / > );